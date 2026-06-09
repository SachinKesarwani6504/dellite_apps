import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNavigation: (() => void) | null = null;

export function navigateSafely(routeName: string, params?: unknown) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(routeName, params);
    return;
  }

  pendingNavigation = () => {
    (navigationRef as any).navigate(routeName, params);
  };
}

export function flushPendingNavigation() {
  if (!navigationRef.isReady() || !pendingNavigation) {
    return;
  }

  const action = pendingNavigation;
  pendingNavigation = null;
  action();
}
