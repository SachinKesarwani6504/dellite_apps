import { useEffect, useRef, useState } from 'react';

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
  const hasRequestedInitialLocationRef = useRef(false);
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
    requestLocationPermission,
  } = locationState;
  const isAuthenticated = status === AuthStatus.AUTHENTICATED;
  const isAuthBootstrapping = status === AuthStatus.BOOTSTRAPPING;
  const hasCoordinates = latitude !== null && longitude !== null;
  const hasLocationInfo = hasCoordinates || Boolean(city || formattedAddress);
  const isLocationBusy = loading || refreshing;
  const isLocationSettled =
    !isAuthenticated
    || permissionStatus === 'denied'
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
    if (
      isInitialStartupComplete
      || !isAuthenticated
      || hasRequestedInitialLocationRef.current
      || permissionStatus !== 'undetermined'
    ) {
      return;
    }

    hasRequestedInitialLocationRef.current = true;
    void (async () => {
      const nextStatus = await requestLocationPermission();
      if (nextStatus === 'granted') {
        await initializeLocation({ forceRefresh: true });
      }
    })();
  }, [
    initializeLocation,
    isInitialStartupComplete,
    isAuthenticated,
    permissionStatus,
    requestLocationPermission,
  ]);

  useEffect(() => {
    if (isInitialStartupComplete || !isAuthenticated || permissionStatus !== 'granted' || initialized || isLocationBusy) {
      return;
    }

    void initializeLocation();
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
