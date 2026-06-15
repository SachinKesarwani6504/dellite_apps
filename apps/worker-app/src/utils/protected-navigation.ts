import { navigateSafely, openProtectedRootRoute } from '@/navigation/navigationRef';
import { ROOT_SCREENS } from '@/types/screen-names';

function normalizeProtectedParams(params?: unknown) {
  if (!params || typeof params !== 'object' || !('initial' in params)) {
    return params;
  }

  const { initial: _initial, ...rest } = params as Record<string, unknown>;
  return rest;
}

export function openWorkerProtectedRoot(routeName: string, params?: unknown) {
  openProtectedRootRoute(ROOT_SCREENS.mainTabsNavigator, routeName, normalizeProtectedParams(params));
}

export function openWorkerMainTabs(params?: unknown) {
  navigateSafely(ROOT_SCREENS.mainTabsNavigator, params);
}
