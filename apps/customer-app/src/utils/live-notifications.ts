import type { NotificationEvent, NotificationType, UserLiveEvent } from '@/types/live-notifications';

export function normalizeLiveEventId(event: UserLiveEvent | null | undefined, fallbackId?: string | null) {
  const candidate = event?.eventId ?? fallbackId ?? null;
  if (typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isExpiredLiveEvent(event: UserLiveEvent) {
  return Number.isFinite(event.expiresAt) && Date.now() > Number(event.expiresAt);
}

export function resolveLiveEventDurationMs(event: UserLiveEvent) {
  if (event.type === 'BOOKING' && event.event === 'JOB_INVITE') {
    return 9000;
  }

  return 5000;
}

export function isSupportedLiveEventNavigation(event: UserLiveEvent) {
  if (event.type === 'JOB') {
    return false;
  }

  if (event.type === 'BOOKING') {
    return Boolean(event.data && typeof event.data === 'object');
  }

  return true;
}

export function mapFcmToLiveEvent(remoteMessage: any): UserLiveEvent {
  const data = remoteMessage?.data || {};
  const title = remoteMessage?.notification?.title || remoteMessage?.title || '';
  const message = remoteMessage?.notification?.body || remoteMessage?.body || '';
  const type = typeof data.type === 'string' ? data.type : 'GENERAL';
  const event = typeof data.event === 'string' ? data.event : 'SYSTEM';

  return {
    eventId: (typeof data.eventId === 'string' && data.eventId.trim().length > 0)
      ? data.eventId
      : (typeof data.notificationId === 'string' ? data.notificationId : undefined),
    type: type as NotificationType,
    event: event as NotificationEvent,
    title,
    message,
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
  };
}
