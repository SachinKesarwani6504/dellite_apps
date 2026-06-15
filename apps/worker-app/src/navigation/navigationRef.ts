import { StackActions, createNavigationContainerRef } from '@react-navigation/native';

import type { PendingNavigation } from '@/types/navigation';

export const navigationRef = createNavigationContainerRef();
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

  pendingNavigations.push({ type: 'navigate', routeName, params });
}

function canOpenProtectedRootRoute(mainRouteName: string, routeName: string) {
  if (!navigationRef.isReady()) {
    return false;
  }

  const state = navigationRef.getRootState();
  return Array.isArray(state?.routeNames)
    && state.routeNames.includes(mainRouteName)
    && state.routeNames.includes(routeName);
}

function openProtectedRootRouteNow(routeName: string, params?: unknown) {
  navigationRef.dispatch(StackActions.push(routeName, params as object | undefined));
}

export function openProtectedRootRoute(mainRouteName: string, routeName: string, params?: unknown) {
  if (canOpenProtectedRootRoute(mainRouteName, routeName)) {
    openProtectedRootRouteNow(routeName, params);
    return;
  }

  pendingNavigations = pendingNavigations.filter(action => action.type !== 'protectedRoot');
  pendingNavigations.push({ type: 'protectedRoot', mainRouteName, routeName, params });
}

export function flushPendingNavigation() {
  if (pendingNavigations.length === 0) {
    return;
  }

  const remaining: PendingNavigation[] = [];

  for (const action of pendingNavigations) {
    if (action.type === 'protectedRoot') {
      if (canOpenProtectedRootRoute(action.mainRouteName, action.routeName)) {
        openProtectedRootRouteNow(action.routeName, action.params);
      } else {
        remaining.push(action);
      }
      continue;
    }

    if (canNavigateToRoute(action.routeName)) {
      (navigationRef as any).navigate(action.routeName, action.params);
    } else {
      remaining.push(action);
    }
  }

  pendingNavigations = remaining;
}
