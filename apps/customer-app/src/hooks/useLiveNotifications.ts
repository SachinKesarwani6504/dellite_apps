import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as Notifications from 'expo-notifications';
import { onChildAdded } from 'firebase/database';
import { markNotificationDelivered, markNotificationRead } from '@/actions/notificationActions';
import { getUserLiveEventsRef, removeUserLiveEvent } from '@/lib/firebase';
import { handleLiveEventNavigation } from '@/utils/live-event-navigation';
import { showInAppNotification } from '@/utils/in-app-notification';
import { loadDeliveredLiveNotificationIds, saveDeliveredLiveNotificationIds } from '@/utils/live-notification-delivery';
import { playInAppNotificationSound } from '@/utils/notification-sound';
import { requestNotificationHistoryRefresh } from '@/utils/notification-history-events';
import { getBadgeCountFromPayload, syncAppBadgeCountFromBackend, updateAppBadgeCount } from '@/utils/appBadge';
import {
  isExpiredLiveEvent,
  isSupportedLiveEventNavigation,
  mapFcmToLiveEvent,
  normalizeLiveEventId,
  resolveNotificationHistoryId,
  resolveLiveEventImageUrl,
  resolveLiveEventMessage,
  resolveLiveEventDurationMs,
  resolveLiveEventTitle,
} from '@/utils/live-notifications';
import type { UserLiveEvent } from '@/types/live-notifications';

function logLiveNotifications(step: string, payload?: Record<string, unknown>) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[customer-live-notifications] ${step}`, payload ?? {});
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

async function removeLiveEventNode(userId: string, eventId: string) {
  try {
    await removeUserLiveEvent(userId, eventId);
  } catch (error) {
    logLiveNotifications('rtdb-event-remove-failed', {
      userId,
      eventId,
      message: error instanceof Error ? error.message : 'Unable to remove live event',
    });
  }
}

async function markDeliveredAndRemoveLiveEvent(userId: string, eventId: string, event: UserLiveEvent | null | undefined) {
  await markSqlNotificationDelivered(event);
  await removeLiveEventNode(userId, eventId);
}

async function removeDeliveredLiveEvent(userId: string, eventId: string, event: UserLiveEvent | null | undefined) {
  await markSqlNotificationRead(event);
  await removeLiveEventNode(userId, eventId);

  requestNotificationHistoryRefresh();
  void syncAppBadgeCountFromBackend(true);
}

async function handleIncomingLiveEvent(
  event: UserLiveEvent | null,
  fallbackEventId: string | null | undefined,
  userId: string | null,
  deliveredEventIdsRef: MutableRefObject<Set<string>>,
  removeLiveEventOnClose = false,
) {
  if (!event) return;
  const rtdbEventId = typeof fallbackEventId === 'string' && fallbackEventId.trim().length > 0
    ? fallbackEventId.trim()
    : null;
  const notificationId = resolveNotificationHistoryId(event);
  const eventId = notificationId ?? normalizeLiveEventId(event, rtdbEventId);
  const deliveryKey = rtdbEventId ?? eventId;
  if (!eventId || !deliveryKey) return;

  if (!userId) {
    return;
  }

  const deliveredEventIds = deliveredEventIdsRef.current;
  if (deliveredEventIds.has(deliveryKey)) {
    return;
  }

  if (isExpiredLiveEvent(event)) {
    deliveredEventIds.add(deliveryKey);
    await saveDeliveredLiveNotificationIds(userId, deliveredEventIds);
    if (removeLiveEventOnClose && rtdbEventId) {
      void removeDeliveredLiveEvent(userId, rtdbEventId, event);
    }
    return;
  }

  if (!isSupportedLiveEventNavigation(event)) {
    deliveredEventIds.add(deliveryKey);
    await saveDeliveredLiveNotificationIds(userId, deliveredEventIds);
    if (removeLiveEventOnClose && rtdbEventId) {
      void removeDeliveredLiveEvent(userId, rtdbEventId, event);
    }
    return;
  }

  deliveredEventIds.add(deliveryKey);
  await saveDeliveredLiveNotificationIds(userId, deliveredEventIds);
  if (removeLiveEventOnClose && rtdbEventId) {
    void markDeliveredAndRemoveLiveEvent(userId, rtdbEventId, event);
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
      handleLiveEventNavigation(event, eventId);
    },
    onClose: removeLiveEventOnClose && rtdbEventId ? () => {
      void removeDeliveredLiveEvent(userId, rtdbEventId, event);
    } : undefined,
  });
}

export function useLiveNotifications({
  userId,
  enabled = true,
}: {
  userId: string | null | undefined;
  enabled?: boolean;
}) {
  const userIdRef = useRef<string | null>(null);
  const deliveredEventIdsRef = useRef<Set<string>>(new Set());
  const deliveredEventIdsLoadRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    userIdRef.current = userId ?? null;
    deliveredEventIdsRef.current = new Set();
    deliveredEventIdsLoadRef.current = (async () => {
      deliveredEventIdsRef.current = await loadDeliveredLiveNotificationIds(userId ?? null);
    })().catch((error) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-live-notifications] delivery-load-failed', error);
      }
    });
  }, [userId]);

  const ensureDeliveryIdsReady = useCallback(async () => {
    await deliveredEventIdsLoadRef.current;
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const activeUserId = userId;
    const eventsRef = getUserLiveEventsRef(userId);
    const unsubscribe = onChildAdded(eventsRef, async snapshot => {
      await ensureDeliveryIdsReady();
      if (userIdRef.current !== activeUserId) {
        return;
      }
      const event = snapshot.val() as UserLiveEvent | null;
      const eventId = normalizeLiveEventId(event, snapshot.key);
      await handleIncomingLiveEvent(event, eventId, activeUserId, deliveredEventIdsRef, true);
    }, error => {
      logLiveNotifications('rtdb-listener-error', {
        userId,
        message: error instanceof Error ? error.message : 'Unknown RTDB listener error',
      });
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, userId]);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(async notification => {
      const activeUserId = userIdRef.current;
      if (!activeUserId) {
        return;
      }
      await ensureDeliveryIdsReady();
      if (userIdRef.current !== activeUserId) {
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
      await handleIncomingLiveEvent(liveEvent, liveEvent.eventId ?? null, activeUserId, deliveredEventIdsRef);
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
      if (userIdRef.current) {
        deliveredEventIdsRef.current.add(eventId);
        void saveDeliveredLiveNotificationIds(userIdRef.current, deliveredEventIdsRef.current);
      }
      handleLiveEventNavigation(liveEvent, eventId);
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
      if (userIdRef.current) {
        deliveredEventIdsRef.current.add(eventId);
        void saveDeliveredLiveNotificationIds(userIdRef.current, deliveredEventIdsRef.current);
      }
      handleLiveEventNavigation(liveEvent, eventId);
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
