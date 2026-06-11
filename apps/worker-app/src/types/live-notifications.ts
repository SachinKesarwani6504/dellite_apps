export type NotificationType =
  | 'BOOKING'
  | 'JOB'
  | 'PAYMENT'
  | 'ONBOARDING'
  | 'GENERAL'
  | 'SYSTEM';

export type NotificationEvent =
  | 'JOB_INVITE'
  | 'WORKER_ACCEPTED_BOOKING'
  | 'WORKER_CANCELLED_BOOKING'
  | 'CUSTOMER_CANCELLED_BOOKING'
  | 'EN_ROUTE'
  | 'BOOKING_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'WELCOME_USER'
  | 'WORKER_APPROVED'
  | 'WORKER_REJECTED'
  | 'DOCUMENT_REQUIRED'
  | 'ACCOUNT_BLOCKED'
  | 'APP_UPDATE_REQUIRED'
  | 'GENERAL';

export type NotificationAction =
  | 'NONE'
  | 'OPEN_SCREEN'
  | 'OPEN_LINK';

export type NotificationRole = 'CUSTOMER' | 'WORKER';

export type NotificationData = {
  screen?: string;
  targetId?: string;
  role?: NotificationRole;
  externalUrl?: string;
  imageUrl?: string;
  title?: string;
  message?: string;
  bookingId?: string;
  bookingCode?: string;
  serviceName?: string;
  amount?: string;
};

export type UserLiveEvent = {
  eventId?: string;
  type: NotificationType;
  event: NotificationEvent;
  action?: NotificationAction;
  title?: string;
  message?: string;
  imageUrl?: string;
  data?: NotificationData | Record<string, unknown>;
  isRead?: boolean;
  isDelivered?: boolean;
  deliveredAt?: number | null;
  readAt?: number | null;
  createdAt: number;
  expiresAt?: number;
};

export type InAppNotificationRequest = {
  notificationId?: string;
  type: NotificationType;
  event: NotificationEvent;
  title: string;
  message: string;
  imageUrl?: string;
  durationMs?: number;
  actionLabel?: string;
  onPress?: () => void;
  onClose?: () => void;
};

export type InAppNotificationStackItem = InAppNotificationRequest & {
  stackId: string;
};
