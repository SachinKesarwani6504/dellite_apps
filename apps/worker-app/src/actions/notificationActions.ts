import { apiDelete, apiGet, apiPatch } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  NotificationBadgeCountResponse,
  NotificationsListResponse,
  NotificationsQuery,
} from '@/types/notifications';
import { toNotificationsQueryString } from '@/utils/notifications';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

export async function getNotifications(query: NotificationsQuery = {}) {
  const response = await apiGet<ApiEnvelope<NotificationsListResponse> | NotificationsListResponse>(
    `/notifications${toNotificationsQueryString(query)}`,
    {
      auth: true,
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}

export async function getNotificationUnreadCount() {
  const response = await apiGet<ApiEnvelope<NotificationBadgeCountResponse> | NotificationBadgeCountResponse>(
    '/notifications/unread-count',
    {
      auth: true,
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}

export async function markNotificationRead(notificationId: string) {
  const response = await apiPatch<ApiEnvelope<NotificationBadgeCountResponse> | NotificationBadgeCountResponse>(
    `/notifications/${notificationId}/mark-read`,
    undefined,
    {
      auth: true,
      toast: { showError: false, showSuccess: false },
    },
  );
  return unwrapData(response);
}

export async function markNotificationDelivered(notificationId: string) {
  const response = await apiPatch<ApiEnvelope<NotificationBadgeCountResponse> | NotificationBadgeCountResponse>(
    `/notifications/${notificationId}/delivered`,
    undefined,
    {
      auth: true,
      toast: { showError: false, showSuccess: false },
    },
  );
  return unwrapData(response);
}

export async function markAllNotificationsRead() {
  const response = await apiPatch<ApiEnvelope<NotificationBadgeCountResponse> | NotificationBadgeCountResponse>(
    '/notifications/mark-all-read',
    undefined,
    {
      auth: true,
      toast: { showError: false, showSuccess: false },
    },
  );
  return unwrapData(response);
}

export async function deleteNotification(notificationId: string) {
  await apiDelete<ApiEnvelope<{ success?: boolean }> | { success?: boolean }>(
    `/notifications/${notificationId}`,
    {
      auth: true,
      toast: { showError: false, showSuccess: false },
    },
  );
}
