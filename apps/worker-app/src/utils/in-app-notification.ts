import type { InAppNotificationRequest } from '@/types/live-notifications';

type Listener = (notification: InAppNotificationRequest) => void;

const listeners = new Set<Listener>();

export function subscribeInAppNotifications(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showInAppNotification(notification: InAppNotificationRequest) {
  listeners.forEach(listener => {
    listener(notification);
  });
}
