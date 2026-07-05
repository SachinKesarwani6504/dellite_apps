import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as Notifications from 'expo-notifications';
import { get, onChildAdded } from 'firebase/database';
import { markNotificationDelivered, markNotificationRead } from '@/actions/notificationActions';
import { getUserLiveEventsRef, removeUserLiveEvent } from '@/lib/firebase';
import { showInAppNotification } from '@/utils/in-app-notification';
import { loadDeliveredLiveNotificationIds, saveDeliveredLiveNotificationIds } from '@/utils/live-notification-delivery';
import { handleNotificationNavigation } from '@/utils/notification-navigation';
import { playInAppNotificationSound } from '@/utils/notification-sound';
import { requestNotificationHistoryRefresh } from '@/utils/notification-history-events';
import { getBadgeCountFromPayload, syncAppBadgeCountFromBackend, updateAppBadgeCount } from '@/utils/appBadge';
import {
  hasDisplayableLiveEventContent,
  isExpiredLiveEvent,
  isLiveEventForAppRole,
  isSupportedLiveEventNavigation,
  mapFcmToLiveEvent,
  normalizeLiveEventId,
  resolveNotificationHistoryId,
  resolveLiveEventImageUrl,
  resolveLiveEventMessage,
  resolveLiveEventDurationMs,
  resolveLiveEventTitle,
} from '@/utils/live-notifications';
import { APP_AUTH_ROLE } from '@/types/auth';
import type { UserLiveEvent } from '@/types/live-notifications';

function logLiveNotifications(step: string, payload?: Record<string, unknown>) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-live-notifications] ${step}`, payload ?? {});
}

async function markSqlNotificationRead(event: UserLiveEvent | null | undefined) {
  const notificationHistoryId = resolveNotificationHistoryId(event);
  if (!notificationHistoryId) {
    return;
  }

  try {
    await markNotificationRead(notificationHistoryId);
  } catch (error) {
    logLiveNotifications('sql-notification-mark-read-failed', {
      notificationHistoryId,
      message: error instanceof Error ? error.message : 'Unable to mark SQL notification as read',
    });
  }
}

async function markSqlNotificationDelivered(event: UserLiveEvent | null | undefined) {
  const notificationHistoryId = resolveNotificationHistoryId(event);
  if (!notificationHistoryId) {
    return;
  }

  try {
    await markNotificationDelivered(notificationHistoryId);
  } catch (error) {
    logLiveNotifications('sql-notification-mark-delivered-failed', {
      notificationHistoryId,
      message: error instanceof Error ? error.message : 'Unable to mark SQL notification as delivered',
    });
  }
}

async function removeLiveEventNode(userId: string, roleEntityId: string, eventId: string) {
  try {
    await removeUserLiveEvent(userId, roleEntityId, eventId);
  } catch (error) {
    logLiveNotifications('rtdb-event-remove-failed', {
      userId,
      eventId,
      message: error instanceof Error ? error.message : 'Unable to remove live event',
    });
  }
}

async function markDeliveredAndRemoveLiveEvent(
  userId: string,
  roleEntityId: string,
  eventId: string,
  event: UserLiveEvent | null | undefined,
) {
  await markSqlNotificationDelivered(event);
  await removeLiveEventNode(userId, roleEntityId, eventId);
}

async function removeDeliveredLiveEvent(
  userId: string,
  roleEntityId: string,
  eventId: string,
  event: UserLiveEvent | null | undefined,
) {
  await markSqlNotificationRead(event);
  await removeLiveEventNode(userId, roleEntityId, eventId);

  requestNotificationHistoryRefresh();
  void syncAppBadgeCountFromBackend(true);
}

function collectLiveEventDeliveryKeys(
  event: UserLiveEvent | null,
  rtdbEventKey: string | null | undefined,
) {
  const rtdbEventId = typeof rtdbEventKey === 'string' && rtdbEventKey.trim().length > 0
    ? rtdbEventKey.trim()
    : null;
  const notificationId = resolveNotificationHistoryId(event);
  const eventId = notificationId ?? normalizeLiveEventId(event, rtdbEventId);
  const keys = new Set<string>();
  if (rtdbEventId) keys.add(rtdbEventId);
  if (eventId) keys.add(eventId);
  if (notificationId) keys.add(notificationId);
  return {
    deliveryKeys: Array.from(keys),
    rtdbEventId,
    eventId,
  };
}

async function absorbLiveEventDeliveryKeys(
  roleEntityId: string,
  deliveredEventIdsRef: MutableRefObject<Set<string>>,
  deliveryKeys: string[],
) {
  if (deliveryKeys.length === 0) {
    return;
  }

  const deliveredEventIds = deliveredEventIdsRef.current;
  let didUpdate = false;
  deliveryKeys.forEach((key) => {
    if (!deliveredEventIds.has(key)) {
      deliveredEventIds.add(key);
      didUpdate = true;
    }
  });

  if (didUpdate) {
    await saveDeliveredLiveNotificationIds(roleEntityId, deliveredEventIds);
  }
}

async function handleIncomingLiveEvent(
  event: UserLiveEvent | null,
  fallbackEventId: string | null | undefined,
  userId: string | null,
  roleEntityId: string | null,
  deliveredEventIdsRef: MutableRefObject<Set<string>>,
  removeLiveEventOnClose = false,
) {
  if (!event) return;
  const { deliveryKeys, rtdbEventId, eventId } = collectLiveEventDeliveryKeys(event, fallbackEventId);
  if (!eventId || deliveryKeys.length === 0) return;

  if (!userId) {
    return;
  }

  if (!roleEntityId) {
    return;
  }

  if (event.isRead === true) {
    return;
  }

  if (!isLiveEventForAppRole(event, APP_AUTH_ROLE)) {
    logLiveNotifications('skip-wrong-role-event', {
      eventId,
      event: event.event,
      type: event.type,
      role: event.data && typeof event.data === 'object' ? event.data.role : undefined,
    });
    return;
  }

  const deliveredEventIds = deliveredEventIdsRef.current;
  if (deliveryKeys.some(key => deliveredEventIds.has(key))) {
    return;
  }

  if (isExpiredLiveEvent(event)) {
    await absorbLiveEventDeliveryKeys(roleEntityId, deliveredEventIdsRef, deliveryKeys);
    if (removeLiveEventOnClose && rtdbEventId) {
      void removeDeliveredLiveEvent(userId, roleEntityId, rtdbEventId, event);
    }
    return;
  }

  if (!isSupportedLiveEventNavigation(event)) {
    await absorbLiveEventDeliveryKeys(roleEntityId, deliveredEventIdsRef, deliveryKeys);
    if (removeLiveEventOnClose && rtdbEventId) {
      void removeDeliveredLiveEvent(userId, roleEntityId, rtdbEventId, event);
    }
    return;
  }

  if (!hasDisplayableLiveEventContent(event)) {
    await absorbLiveEventDeliveryKeys(roleEntityId, deliveredEventIdsRef, deliveryKeys);
    if (removeLiveEventOnClose && rtdbEventId) {
      void removeDeliveredLiveEvent(userId, roleEntityId, rtdbEventId, event);
    }
    return;
  }

  await absorbLiveEventDeliveryKeys(roleEntityId, deliveredEventIdsRef, deliveryKeys);
  if (removeLiveEventOnClose && rtdbEventId) {
    void markDeliveredAndRemoveLiveEvent(userId, roleEntityId, rtdbEventId, event);
  } else {
    void markSqlNotificationDelivered(event);
  }
  const badgeCount = getBadgeCountFromPayload(event.data);
  if (badgeCount !== null) {
    void updateAppBadgeCount(badgeCount);
  }
  void syncAppBadgeCountFromBackend();
  void playInAppNotificationSound();
  requestNotificationHistoryRefresh();
  showInAppNotification({
    notificationId: eventId,
    type: event.type,
    event: event.event,
    title: resolveLiveEventTitle(event),
    message: resolveLiveEventMessage(event),
    imageUrl: resolveLiveEventImageUrl(event),
    durationMs: resolveLiveEventDurationMs(event),
    onPress: () => {
      void markSqlNotificationRead(event);
      void handleNotificationNavigation(event);
    },
    onClose: removeLiveEventOnClose && rtdbEventId ? () => {
      void removeDeliveredLiveEvent(userId, roleEntityId, rtdbEventId, event);
    } : undefined,
  });
}

export function useLiveNotifications({
  userId,
  roleEntityId,
  enabled = true,
}: {
  userId: string | null | undefined;
  roleEntityId: string | null | undefined;
  enabled?: boolean;
}) {
  const userIdRef = useRef<string | null>(null);
  const roleEntityIdRef = useRef<string | null>(null);
  const deliveredEventIdsRef = useRef<Set<string>>(new Set());
  const deliveredEventIdsLoadRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    userIdRef.current = userId ?? null;
    roleEntityIdRef.current = roleEntityId ?? null;
    deliveredEventIdsRef.current = new Set();
    deliveredEventIdsLoadRef.current = (async () => {
      deliveredEventIdsRef.current = await loadDeliveredLiveNotificationIds(roleEntityId ?? userId ?? null);
    })().catch((error) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[worker-live-notifications] delivery-load-failed', error);
      }
    });
  }, [roleEntityId, userId]);

  const ensureDeliveryIdsReady = useCallback(async () => {
    await deliveredEventIdsLoadRef.current;
  }, []);

  useEffect(() => {
    if (!enabled || !userId || !roleEntityId) {
      return;
    }

    const activeUserId = userId;
    const activeRoleEntityId = roleEntityId;
    const eventsRef = getUserLiveEventsRef(userId, roleEntityId);
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      await ensureDeliveryIdsReady();
      if (cancelled) {
        return;
      }

      try {
        const snapshot = await get(eventsRef);
        if (cancelled) {
          return;
        }

        const seededKeys = new Set<string>();
        snapshot.forEach(child => {
          const { deliveryKeys } = collectLiveEventDeliveryKeys(child.val() as UserLiveEvent | null, child.key);
          deliveryKeys.forEach(key => seededKeys.add(key));
        });

        if (seededKeys.size > 0) {
          await absorbLiveEventDeliveryKeys(activeRoleEntityId, deliveredEventIdsRef, Array.from(seededKeys));
        }
      } catch (error) {
        logLiveNotifications('rtdb-initial-sync-failed', {
          userId,
          message: error instanceof Error ? error.message : 'Unable to seed existing live events',
        });
      }

      if (cancelled) {
        return;
      }

      unsubscribe = onChildAdded(eventsRef, async snapshot => {
        await ensureDeliveryIdsReady();
        if (cancelled || userIdRef.current !== activeUserId || roleEntityIdRef.current !== activeRoleEntityId) {
          return;
        }
        const event = snapshot.val() as UserLiveEvent | null;
        const eventId = normalizeLiveEventId(event, snapshot.key);
        await handleIncomingLiveEvent(event, eventId, activeUserId, activeRoleEntityId, deliveredEventIdsRef, true);
      }, error => {
        logLiveNotifications('rtdb-listener-error', {
          userId,
          message: error instanceof Error ? error.message : 'Unknown RTDB listener error',
        });
      });
    };

    void setupListener();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled, ensureDeliveryIdsReady, roleEntityId, userId]);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(async notification => {
      const activeUserId = userIdRef.current;
      const activeRoleEntityId = roleEntityIdRef.current;
      if (!activeUserId || !activeRoleEntityId) {
        return;
      }
      await ensureDeliveryIdsReady();
      if (userIdRef.current !== activeUserId || roleEntityIdRef.current !== activeRoleEntityId) {
        return;
      }
      const content = notification.request.content;
      const badgeCount = getBadgeCountFromPayload(content.data);
      if (badgeCount !== null) {
        void updateAppBadgeCount(badgeCount);
      }
      const liveEvent = mapFcmToLiveEvent({
        data: content.data,
        notification: {
          title: content.title,
          body: content.body,
        },
      });
      await handleIncomingLiveEvent(liveEvent, liveEvent.eventId ?? null, activeUserId, activeRoleEntityId, deliveredEventIdsRef);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
      const content = response.notification.request.content;
      void syncAppBadgeCountFromBackend(true);
      const liveEvent = mapFcmToLiveEvent({
        data: content.data,
        notification: {
          title: content.title,
          body: content.body,
        },
      });

      const eventId = normalizeLiveEventId(liveEvent, liveEvent.eventId ?? null);
      if (!eventId) return;
      void markSqlNotificationRead(liveEvent);
      if (roleEntityIdRef.current) {
        deliveredEventIdsRef.current.add(eventId);
        void saveDeliveredLiveNotificationIds(roleEntityIdRef.current, deliveredEventIdsRef.current);
      }
      void handleNotificationNavigation(liveEvent);
    });

    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const content = response.notification.request.content;
      void syncAppBadgeCountFromBackend(true);
      const liveEvent = mapFcmToLiveEvent({
        data: content.data,
        notification: {
          title: content.title,
          body: content.body,
        },
      });
      const eventId = normalizeLiveEventId(liveEvent, liveEvent.eventId ?? null);
      if (!eventId) return;
      void markSqlNotificationRead(liveEvent);
      if (roleEntityIdRef.current) {
        deliveredEventIdsRef.current.add(eventId);
        void saveDeliveredLiveNotificationIds(roleEntityIdRef.current, deliveredEventIdsRef.current);
      }
      void handleNotificationNavigation(liveEvent);
    }).catch(() => {});

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return useMemo(() => ({
    handledEventIdsCount: deliveredEventIdsRef.current.size,
    activeUserId: userIdRef.current,
  }), [userId]);
}
