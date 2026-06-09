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
  | 'APP_UPDATE_REQUIRED';

export type UserLiveEvent = {
  eventId?: string;
  type: NotificationType;
  event: NotificationEvent;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
};

export type InAppNotificationRequest = {
  notificationId?: string;
  type: NotificationType;
  event: NotificationEvent;
  title: string;
  message: string;
  durationMs?: number;
  actionLabel?: string;
  onPress?: () => void;
  onClose?: () => void;
};
