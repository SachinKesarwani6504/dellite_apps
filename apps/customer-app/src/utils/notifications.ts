import type { NotificationListItem, NotificationsQuery, NotificationTypeMeta } from '@/types/notifications';
import type { NotificationData, UserLiveEvent } from '@/types/live-notifications';
import { theme } from '@/utils/theme';
import { formatDisplayDate } from '@/utils/date-display';

const NOTIFICATION_TYPE_META: Record<NotificationListItem['type'], NotificationTypeMeta> = {
  BOOKING: { label: 'Booking', icon: 'calendar-outline', color: theme.colors.primary },
  JOB: { label: 'Job', icon: 'briefcase-outline', color: theme.colors.primary },
  PAYMENT: { label: 'Payment', icon: 'cash-outline', color: theme.colors.positive },
  ONBOARDING: { label: 'Onboarding', icon: 'sparkles-outline', color: theme.colors.accent },
  GENERAL: { label: 'General', icon: 'notifications-outline', color: theme.colors.primary },
  SYSTEM: { label: 'System', icon: 'shield-checkmark-outline', color: theme.colors.negative },
};

export function toNotificationsQueryString(query: NotificationsQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 20));
  if (query.unread === true) params.set('unread', 'true');
  if (query.type) params.set('type', query.type);
  if (query.event) params.set('event', query.event);
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function getNotificationTypeMeta(type: NotificationListItem['type']) {
  return NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_META.GENERAL;
}

export function formatNotificationTimestamp(value: string) {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return '';
  const diffMs = Date.now() - createdAt.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  if (diffMs < minuteMs) return 'Just now';
  if (diffMs < hourMs) return `${Math.max(1, Math.floor(diffMs / minuteMs))}m ago`;
  if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)}h ago`;
  if (diffMs < 7 * dayMs) return `${Math.floor(diffMs / dayMs)}d ago`;
  return formatDisplayDate(createdAt);
}

export function toLiveEventFromNotification(item: NotificationListItem): UserLiveEvent {
  const createdAt = Date.parse(item.createdAt) || Date.now();
  return {
    eventId: item.id,
    type: item.type,
    event: item.event,
    action: item.action ?? undefined,
    title: item.title,
    message: item.message,
    data: item.data ?? {},
    createdAt,
    expiresAt: createdAt + 24 * 60 * 60 * 1000,
  };
}

export function getNotificationImageUrl(data: NotificationData | null | undefined) {
  if (!data?.imageUrl || typeof data.imageUrl !== 'string') {
    return undefined;
  }

  const trimmed = data.imageUrl.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function mergeNotificationsById(current: NotificationListItem[], incoming: NotificationListItem[]) {
  const seen = new Set<string>();
  return [...current, ...incoming].filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
