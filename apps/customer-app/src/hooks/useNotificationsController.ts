import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/actions/notificationActions';
import type {
  NotificationListItem,
  NotificationsController,
  NotificationsLoadOptions,
  NotificationsPagination,
} from '@/types/notifications';
import { subscribeNotificationHistoryRefresh } from '@/utils/notification-history-events';
import { handleLiveEventNavigation } from '@/utils/live-event-navigation';
import { mergeNotificationsById, toLiveEventFromNotification } from '@/utils/notifications';
import { APP_TEXT } from '@/utils/appText';
import { syncAppBadgeCountFromBackend, updateAppBadgeCount } from '@/utils/appBadge';

const NOTIFICATIONS_PAGE_LIMIT = 20;

export function useNotificationsController(): NotificationsController {
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [pagination, setPagination] = useState<NotificationsPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const requestKeyRef = useRef(0);

  const loadPage = useCallback(async (page: number, options: NotificationsLoadOptions = {}) => {
    const requestKey = requestKeyRef.current + 1;
    requestKeyRef.current = requestKey;
    if (options.refresh) {
      setRefreshing(true);
    } else if (options.append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getNotifications({ page, limit: NOTIFICATIONS_PAGE_LIMIT });
      if (requestKey !== requestKeyRef.current) {
        return;
      }
      const nextItems = Array.isArray(response.items) ? response.items : [];
      setPagination(response.pagination ?? null);
      setItems(current => {
        if (options.append) {
          return mergeNotificationsById(current, nextItems);
        }
        return nextItems;
      });
    } catch (loadError) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-notifications] fetch-failed', loadError);
      }
      setError(APP_TEXT.notifications.errorTitle);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadPage(1, { refresh: true });
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (loading || refreshing || loadingMore || !pagination?.hasNextPage) {
      return;
    }
    await loadPage((pagination.page ?? 1) + 1, { append: true });
  }, [loadPage, loading, loadingMore, pagination?.hasNextPage, pagination?.page, refreshing]);

  const markAllRead = useCallback(async () => {
    setMarkingAllRead(true);
    try {
      const response = await markAllNotificationsRead();
      setItems(current => current.map(item => ({ ...item, isRead: true })));
      if (typeof response?.badgeCount === 'number') {
        await updateAppBadgeCount(response.badgeCount);
      } else {
        await syncAppBadgeCountFromBackend(true);
      }
    } catch (markError) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-notifications] mark-all-read-failed', markError);
      }
    } finally {
      setMarkingAllRead(false);
    }
  }, []);

  const openNotification = useCallback(async (item: NotificationListItem) => {
    if (!item.isRead) {
      setItems(current => current.map(currentItem => (
        currentItem.id === item.id ? { ...currentItem, isRead: true } : currentItem
      )));
      try {
        const response = await markNotificationRead(item.id);
        if (typeof response?.badgeCount === 'number') {
          await updateAppBadgeCount(response.badgeCount);
        } else {
          await syncAppBadgeCountFromBackend(true);
        }
      } catch (markError) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[customer-notifications] mark-read-failed', markError);
        }
      }
    }

    handleLiveEventNavigation(toLiveEventFromNotification(item), item.id);
  }, []);

  const deleteNotificationById = useCallback(async (item: NotificationListItem) => {
    setDeletingIds(current => new Set(current).add(item.id));
    try {
      await deleteNotification(item.id);
      setItems(current => current.filter(currentItem => currentItem.id !== item.id));
      await syncAppBadgeCountFromBackend(true);
    } catch (deleteError) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-notifications] delete-failed', deleteError);
      }
    } finally {
      setDeletingIds(current => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    return subscribeNotificationHistoryRefresh(() => {
      void refresh();
    });
  }, [refresh]);

  const unreadCount = useMemo(() => items.filter(item => !item.isRead).length, [items]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    markingAllRead,
    error,
    hasNextPage: pagination?.hasNextPage === true,
    unreadCount,
    deletingIds,
    refresh,
    loadMore,
    markAllRead,
    openNotification,
    deleteNotificationById,
  };
}
