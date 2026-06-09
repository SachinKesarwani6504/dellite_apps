import { useEffect, useMemo, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { onChildAdded } from 'firebase/database';
import { getUserLiveEventsRef } from '@/lib/firebase';
import { handleLiveEventNavigation } from '@/utils/live-event-navigation';
import { showInAppNotification } from '@/utils/in-app-notification';
import {
  isExpiredLiveEvent,
  isSupportedLiveEventNavigation,
  mapFcmToLiveEvent,
  normalizeLiveEventId,
  resolveLiveEventDurationMs,
} from '@/utils/live-notifications';
import type { UserLiveEvent } from '@/types/live-notifications';

const handledEventIds = new Set<string>();

function logLiveNotifications(step: string, payload?: Record<string, unknown>) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[customer-live-notifications] ${step}`, payload ?? {});
}

async function handleIncomingLiveEvent(event: UserLiveEvent | null, fallbackEventId?: string | null) {
  if (!event) return;
  const eventId = normalizeLiveEventId(event, fallbackEventId);
  if (!eventId) return;

  if (handledEventIds.has(eventId)) {
    return;
  }

  if (isExpiredLiveEvent(event)) {
    handledEventIds.add(eventId);
    return;
  }

  if (!isSupportedLiveEventNavigation(event)) {
    handledEventIds.add(eventId);
    return;
  }

  handledEventIds.add(eventId);
  showInAppNotification({
    notificationId: eventId,
    type: event.type,
    event: event.event,
    title: event.title,
    message: event.message,
    durationMs: resolveLiveEventDurationMs(event),
    onPress: () => {
      handleLiveEventNavigation(event, eventId);
    },
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

  useEffect(() => {
    userIdRef.current = userId ?? null;
  }, [userId]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const eventsRef = getUserLiveEventsRef(userId);
    const unsubscribe = onChildAdded(eventsRef, async snapshot => {
      const event = snapshot.val() as UserLiveEvent | null;
      const eventId = normalizeLiveEventId(event, snapshot.key);
      await handleIncomingLiveEvent(event, eventId);
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
      const content = notification.request.content;
      const liveEvent = mapFcmToLiveEvent({
        data: content.data,
        notification: {
          title: content.title,
          body: content.body,
        },
      });
      await handleIncomingLiveEvent(liveEvent, liveEvent.eventId ?? null);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
      const content = response.notification.request.content;
      const liveEvent = mapFcmToLiveEvent({
        data: content.data,
        notification: {
          title: content.title,
          body: content.body,
        },
      });

      const eventId = normalizeLiveEventId(liveEvent, liveEvent.eventId ?? null);
      if (!eventId) return;
      handledEventIds.add(eventId);
      handleLiveEventNavigation(liveEvent, eventId);
    });

    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const content = response.notification.request.content;
      const liveEvent = mapFcmToLiveEvent({
        data: content.data,
        notification: {
          title: content.title,
          body: content.body,
        },
      });
      const eventId = normalizeLiveEventId(liveEvent, liveEvent.eventId ?? null);
      if (!eventId) return;
      handledEventIds.add(eventId);
      handleLiveEventNavigation(liveEvent, eventId);
    }).catch(() => {});

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return useMemo(() => ({
    handledEventIdsCount: handledEventIds.size,
    activeUserId: userIdRef.current,
  }), [userId]);
}
