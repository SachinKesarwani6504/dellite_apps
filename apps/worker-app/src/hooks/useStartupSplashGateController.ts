import { useEffect, useState } from 'react';

import { AuthStatus } from '@/types/auth-status';
import type {
  StartupSplashGateControllerParams,
  StartupSplashGateControllerValue,
} from '@/types/startup-splash-gate';

const LOCATION_SPLASH_MAX_WAIT_MS = 2400;

export function useStartupSplashGateController({
  status,
  locationState,
}: StartupSplashGateControllerParams): StartupSplashGateControllerValue {
  const [isInitialStartupComplete, setIsInitialStartupComplete] = useState(false);
  const [hasLocationSplashTimedOut, setHasLocationSplashTimedOut] = useState(false);
  const {
    city,
    error,
    formattedAddress,
    initialized,
    latitude,
    loading,
    longitude,
    permissionStatus,
    refreshing,
    initializeLocation,
  } = locationState;
  const isAuthenticated = status === AuthStatus.AUTHENTICATED;
  const isAuthBootstrapping = status === AuthStatus.BOOTSTRAPPING;
  const hasCoordinates = latitude !== null && longitude !== null;
  const hasLocationInfo = hasCoordinates || Boolean(city || formattedAddress);
  const isLocationBusy = loading || refreshing;
  const isLocationSettled =
    !isAuthenticated
    || permissionStatus === 'denied'
    || permissionStatus === 'undetermined'
    || (
      permissionStatus === 'granted'
      && initialized
      && (hasLocationInfo || Boolean(error))
      && !isLocationBusy
    );
  const shouldShowSplash = isAuthBootstrapping || (!isLocationSettled && !hasLocationSplashTimedOut);

  useEffect(() => {
    if (!isAuthenticated || isLocationSettled || hasLocationSplashTimedOut) {
      return undefined;
    }

    const timerId = setTimeout(() => {
      setHasLocationSplashTimedOut(true);
    }, LOCATION_SPLASH_MAX_WAIT_MS);

    return () => {
      clearTimeout(timerId);
    };
  }, [hasLocationSplashTimedOut, isAuthenticated, isLocationSettled]);

  useEffect(() => {
    if (isInitialStartupComplete || shouldShowSplash) {
      return;
    }

    setIsInitialStartupComplete(true);
  }, [isInitialStartupComplete, shouldShowSplash]);

  useEffect(() => {
    if (isInitialStartupComplete || !isAuthenticated || permissionStatus !== 'granted' || initialized || isLocationBusy) {
      return;
    }

    void initializeLocation().catch(() => undefined);
  }, [
    initializeLocation,
    initialized,
    isInitialStartupComplete,
    isAuthenticated,
    isLocationBusy,
    permissionStatus,
  ]);

  return {
    isAuthBootstrapping,
    isInitialStartupComplete,
    shouldShowSplash,
  };
}
