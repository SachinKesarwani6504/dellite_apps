import type { NotificationEvent, NotificationType, UserLiveEvent } from '@/types/live-notifications';

const DEFAULT_LIVE_EVENT_TITLE = 'Dellite';
const DEFAULT_LIVE_EVENT_MESSAGE = 'You have a new update.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function normalizeText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readStringFromData(event: UserLiveEvent | null | undefined, ...keys: string[]) {
  if (!isRecord(event?.data)) {
    return null;
  }

  for (const key of keys) {
    const value = normalizeText(event.data[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

export function normalizeLiveEventId(event: UserLiveEvent | null | undefined, fallbackId?: string | null) {
  const candidate =
    event?.eventId
    ?? readStringFromData(event, 'eventId', 'notificationId', 'id')
    ?? fallbackId
    ?? null;
  if (typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveLiveEventTitle(event: UserLiveEvent) {
  return readStringFromData(event, 'title', 'notificationTitle')
    ?? DEFAULT_LIVE_EVENT_TITLE;
}

export function resolveLiveEventMessage(event: UserLiveEvent) {
  return readStringFromData(event, 'message', 'body', 'description')
    ?? DEFAULT_LIVE_EVENT_MESSAGE;
}

export function resolveLiveEventImageUrl(event: UserLiveEvent) {
  return readStringFromData(event, 'imageUrl', 'imageURL', 'image', 'thumbnailUrl')
    ?? undefined;
}

export function resolveNotificationHistoryId(event: UserLiveEvent | null | undefined) {
  return readStringFromData(event, 'notificationId') ?? null;
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
  const rawData = remoteMessage?.data || {};
  const title = remoteMessage?.notification?.title || remoteMessage?.title || rawData.title || '';
  const message = remoteMessage?.notification?.body || remoteMessage?.body || rawData.message || rawData.body || '';
  const type = typeof rawData.type === 'string' ? rawData.type : 'GENERAL';
  const event = typeof rawData.event === 'string' ? rawData.event : 'SYSTEM';
  const data = {
    ...rawData,
    title: typeof rawData.title === 'string' && rawData.title.trim().length > 0 ? rawData.title : title,
    message: typeof rawData.message === 'string' && rawData.message.trim().length > 0 ? rawData.message : message,
  };

  return {
    eventId: (typeof data.notificationId === 'string' && data.notificationId.trim().length > 0)
      ? data.notificationId
      : (typeof data.eventId === 'string' ? data.eventId : undefined),
    type: type as NotificationType,
    event: event as NotificationEvent,
    title,
    message,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
  };
}
