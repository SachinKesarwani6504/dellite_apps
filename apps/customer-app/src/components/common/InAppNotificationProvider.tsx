import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { InAppNotificationBanner } from '@/components/common/InAppNotificationBanner';
import { subscribeInAppNotifications } from '@/utils/in-app-notification';
import type { InAppNotificationRequest } from '@/types/live-notifications';

const DEFAULT_DURATION_MS = 5000;

export function InAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const [currentNotification, setCurrentNotification] = useState<InAppNotificationRequest | null>(null);
  const queueRef = useRef<InAppNotificationRequest[]>([]);
  const activeNotificationRef = useRef<InAppNotificationRequest | null>(null);

  const showNextNotification = useCallback(() => {
    if (activeNotificationRef.current || queueRef.current.length === 0) {
      return;
    }

    const nextNotification = queueRef.current.shift() ?? null;
    activeNotificationRef.current = nextNotification;
    setCurrentNotification(nextNotification);
  }, []);

  const dismissCurrentNotification = useCallback(() => {
    activeNotificationRef.current = null;
    setCurrentNotification(null);
    showNextNotification();
  }, [showNextNotification]);

  useEffect(() => {
    const unsubscribe = subscribeInAppNotifications((notification) => {
      if (activeNotificationRef.current) {
        queueRef.current.push(notification);
        return;
      }

      activeNotificationRef.current = notification;
      setCurrentNotification(notification);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentNotification) {
      return;
    }

    const timeoutMs = currentNotification.durationMs ?? DEFAULT_DURATION_MS;
    const timer = setTimeout(() => {
      dismissCurrentNotification();
    }, timeoutMs);

    return () => {
      clearTimeout(timer);
    };
  }, [currentNotification, dismissCurrentNotification]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {currentNotification ? (
        <InAppNotificationBanner
          notification={currentNotification}
          onPress={() => {
            currentNotification.onPress?.();
            dismissCurrentNotification();
          }}
          onClose={() => {
            currentNotification.onClose?.();
            dismissCurrentNotification();
          }}
        />
      ) : null}
    </View>
  );
}
