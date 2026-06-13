import { navigateSafely, openProtectedRootRoute } from '@/navigation/navigationRef';
import { ROOT_SCREEN } from '@/types/screen-names';

function normalizeProtectedParams(params?: unknown) {
  if (!params || typeof params !== 'object' || !('initial' in params)) {
    return params;
  }

  const { initial: _initial, ...rest } = params as Record<string, unknown>;
  return rest;
}

export function openCustomerProtectedRoot(routeName: string, params?: unknown) {
  openProtectedRootRoute(ROOT_SCREEN.MAIN_TABS_NAVIGATOR, routeName, normalizeProtectedParams(params));
}

export function openCustomerMainTabs(params?: unknown) {
  navigateSafely(ROOT_SCREEN.MAIN_TABS_NAVIGATOR, params);
}
