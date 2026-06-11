import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

type PendingNavigation = {
  routeName: string;
  params?: unknown;
};

let pendingNavigations: PendingNavigation[] = [];

function canNavigateToRoute(routeName: string) {
  if (!navigationRef.isReady()) {
    return false;
  }

  const state = navigationRef.getRootState();
  return Array.isArray(state?.routeNames) && state.routeNames.includes(routeName);
}

export function navigateSafely(routeName: string, params?: unknown) {
  if (canNavigateToRoute(routeName)) {
    (navigationRef as any).navigate(routeName, params);
    return;
  }

  pendingNavigations.push({ routeName, params });
}

export function flushPendingNavigation() {
  if (pendingNavigations.length === 0) {
    return;
  }

  const remaining: PendingNavigation[] = [];

  for (const action of pendingNavigations) {
    if (canNavigateToRoute(action.routeName)) {
      (navigationRef as any).navigate(action.routeName, action.params);
    } else {
      remaining.push(action);
    }
  }

  pendingNavigations = remaining;
}
