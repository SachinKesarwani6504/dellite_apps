import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InAppNotificationBanner } from '@/components/common/InAppNotificationBanner';
import { subscribeInAppNotifications } from '@/utils/in-app-notification';
import type { InAppNotificationRequest, InAppNotificationStackItem } from '@/types/live-notifications';

const DEFAULT_DURATION_MS = 5000;
const MAX_VISIBLE_NOTIFICATIONS = 3;
const STACK_GAP = 10;
const notificationEntering = FadeInRight.duration(220);
const notificationExiting = FadeOutLeft.duration(180);
const notificationLayout = LinearTransition.springify().damping(18).stiffness(180);

export function InAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<InAppNotificationStackItem[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const localIdRef = useRef(0);

  const clearNotificationTimer = useCallback((stackId: string) => {
    const timer = timersRef.current.get(stackId);
    if (!timer) return;
    clearTimeout(timer);
    timersRef.current.delete(stackId);
  }, []);

  const dismissNotification = useCallback((notification: InAppNotificationStackItem) => {
    clearNotificationTimer(notification.stackId);
    setNotifications(current => current.filter(item => item.stackId !== notification.stackId));
    notification.onClose?.();
  }, [clearNotificationTimer]);

  const scheduleNotificationDismissal = useCallback((notification: InAppNotificationStackItem) => {
    clearNotificationTimer(notification.stackId);
    const timeoutMs = notification.durationMs ?? DEFAULT_DURATION_MS;
    const timer = setTimeout(() => {
      dismissNotification(notification);
    }, timeoutMs);
    timersRef.current.set(notification.stackId, timer);
  }, [clearNotificationTimer, dismissNotification]);

  const toStackItem = useCallback((notification: InAppNotificationRequest): InAppNotificationStackItem => {
    localIdRef.current += 1;
    return {
      ...notification,
      stackId: notification.notificationId ?? `local-notification-${Date.now()}-${localIdRef.current}`,
    };
  }, []);

  const showNotification = useCallback((notification: InAppNotificationRequest) => {
    const stackItem = toStackItem(notification);
    scheduleNotificationDismissal(stackItem);
    setNotifications(current => {
      const existingItems = current.filter(item => item.stackId !== stackItem.stackId);
      const nextItems = [stackItem, ...existingItems];
      const visibleItems = nextItems.slice(0, MAX_VISIBLE_NOTIFICATIONS);
      nextItems.slice(MAX_VISIBLE_NOTIFICATIONS).forEach(item => {
        clearNotificationTimer(item.stackId);
        item.onClose?.();
      });
      return visibleItems;
    });
  }, [clearNotificationTimer, scheduleNotificationDismissal, toStackItem]);

  useEffect(() => subscribeInAppNotifications(showNotification), [showNotification]);

  useEffect(() => () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: insets.top + 12,
          zIndex: 9999,
        }}
      >
        {notifications.map((notification, index) => (
          <Animated.View
            key={notification.stackId}
            collapsable={false}
            pointerEvents="box-none"
            entering={notificationEntering}
            exiting={notificationExiting}
            layout={notificationLayout}
            style={{
              marginBottom: index === notifications.length - 1 ? 0 : STACK_GAP,
              zIndex: 9999 - index,
            }}
          >
            <InAppNotificationBanner
              notification={notification}
              floating={false}
              onPress={() => {
                clearNotificationTimer(notification.stackId);
                notification.onPress?.();
              }}
              onClose={() => {
                dismissNotification(notification);
              }}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
