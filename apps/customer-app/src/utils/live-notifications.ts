import type {
  NotificationAction,
  NotificationEvent,
  NotificationRole,
  NotificationType,
  UserLiveEvent,
} from '@/types/live-notifications';

const DEFAULT_LIVE_EVENT_TITLE = 'Dellite';
const DEFAULT_LIVE_EVENT_MESSAGE = 'You have a new update.';
const WORKER_ONLY_EVENTS: ReadonlySet<NotificationEvent> = new Set(['JOB_INVITE']);

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

  const data = event.data as Record<string, unknown>;

  for (const key of keys) {
    const value = normalizeText(data[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeAction(value: unknown): NotificationAction | undefined {
  return value === 'NONE' || value === 'OPEN_SCREEN' || value === 'OPEN_LINK' ? value : undefined;
}

function normalizeRole(value: unknown): NotificationRole | null {
  return value === 'CUSTOMER' || value === 'WORKER' ? value : null;
}

export function isLiveEventForAppRole(event: UserLiveEvent, appRole: NotificationRole) {
  const explicitRole = normalizeRole(readStringFromData(event, 'role'));
  if (explicitRole) {
    return explicitRole === appRole;
  }

  if (event.type === 'JOB' || WORKER_ONLY_EVENTS.has(event.event)) {
    return appRole === 'WORKER';
  }

  return true;
}

export function normalizeLiveEventId(event: UserLiveEvent | null | undefined, fallbackId?: string | null) {
  const candidate =
    event?.eventId
    ?? fallbackId
    ?? null;
  if (typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveLiveEventTitle(event: UserLiveEvent) {
  return readStringFromData(event, 'title', 'notificationTitle')
    ?? normalizeText(event.title)
    ?? DEFAULT_LIVE_EVENT_TITLE;
}

export function resolveLiveEventMessage(event: UserLiveEvent) {
  return readStringFromData(event, 'message', 'body', 'description')
    ?? normalizeText(event.message)
    ?? DEFAULT_LIVE_EVENT_MESSAGE;
}

export function hasDisplayableLiveEventContent(event: UserLiveEvent) {
  const title = resolveLiveEventTitle(event);
  const message = resolveLiveEventMessage(event);
  return title !== DEFAULT_LIVE_EVENT_TITLE || message !== DEFAULT_LIVE_EVENT_MESSAGE;
}

export function resolveLiveEventImageUrl(event: UserLiveEvent) {
  return readStringFromData(event, 'imageUrl', 'imageURL', 'image', 'thumbnailUrl')
    ?? normalizeText(event.imageUrl)
    ?? undefined;
}

export function resolveNotificationHistoryId(event: UserLiveEvent | null | undefined) {
  return normalizeLiveEventId(event) ?? null;
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
  const action = normalizeAction(event.action);
  return action === undefined || action === 'OPEN_LINK' || Boolean(event.data && typeof event.data === 'object');
}

export function mapFcmToLiveEvent(remoteMessage: any): UserLiveEvent {
  const rawData = remoteMessage?.data || {};
  const title = remoteMessage?.notification?.title || remoteMessage?.title || rawData.title || '';
  const message = remoteMessage?.notification?.body || remoteMessage?.body || rawData.message || rawData.body || '';
  const type = typeof rawData.type === 'string' ? rawData.type : 'GENERAL';
  const event = typeof rawData.event === 'string' ? rawData.event : 'GENERAL';
  const data = {
    screen: typeof rawData.screen === 'string' ? rawData.screen : undefined,
    targetId: typeof rawData.targetId === 'string' ? rawData.targetId : undefined,
    role: rawData.role === 'CUSTOMER' || rawData.role === 'WORKER' ? rawData.role : undefined,
    externalUrl: typeof rawData.externalUrl === 'string' ? rawData.externalUrl : undefined,
    imageUrl: typeof rawData.imageUrl === 'string' ? rawData.imageUrl : undefined,
    title: typeof rawData.title === 'string' && rawData.title.trim().length > 0 ? rawData.title : title,
    message: typeof rawData.message === 'string' && rawData.message.trim().length > 0 ? rawData.message : message,
  };

  return {
    eventId: (typeof rawData.notificationId === 'string' && rawData.notificationId.trim().length > 0)
      ? rawData.notificationId
      : (typeof rawData.eventId === 'string' ? rawData.eventId : undefined),
    type: type as NotificationType,
    event: event as NotificationEvent,
    action: normalizeAction(rawData.action),
    title,
    message,
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
  };
}
