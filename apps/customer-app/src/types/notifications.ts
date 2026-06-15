import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type {
  NotificationAction,
  NotificationData,
  NotificationEvent,
  NotificationType,
} from '@/types/live-notifications';

export const CUSTOMER_NOTIFICATION_SCREENS = {
  BOOKINGS: 'Bookings',
  BOOKING_DETAILS: 'BookingsDetails',
  PROFILE: 'Profile',
  EDIT_PROFILE: 'EditProfile',
  REFERRAL: 'Referral',
  NOTIFICATIONS: 'Notifications',
} as const;

export type NotificationListItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  event: NotificationEvent;
  action?: NotificationAction | null;
  data?: NotificationData | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationNavigationPayload = {
  notificationId?: string;
  title?: string;
  message?: string;
  type?: NotificationType;
  event?: NotificationEvent;
  action?: NotificationAction;
  data?: NotificationData | null;
};

export type NotificationsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type NotificationsListResponse = {
  items: NotificationListItem[];
  pagination: NotificationsPagination;
};

export type NotificationsQuery = {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: NotificationType;
  event?: NotificationEvent;
};

export type NotificationBadgeCountResponse = {
  unreadNotificationCount: number;
  pendingJobInviteCount: number;
  badgeCount: number;
};

export type NotificationListItemProps = {
  item: NotificationListItem;
  onPress: (item: NotificationListItem) => void;
  onDelete: (item: NotificationListItem) => void;
  deleting: boolean;
};

export type NotificationTypeMeta = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

export type NotificationsLoadOptions = {
  append?: boolean;
  refresh?: boolean;
};

export type NotificationsController = {
  items: NotificationListItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  markingAllRead: boolean;
  error: string | null;
  hasNextPage: boolean;
  unreadCount: number;
  deletingIds: Set<string>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAllRead: () => Promise<void>;
  openNotification: (item: NotificationListItem) => Promise<void>;
  deleteNotificationById: (item: NotificationListItem) => Promise<void>;
};
