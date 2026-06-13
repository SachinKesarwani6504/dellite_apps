import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import { AUTH_STATUS } from '@/types/auth';
import { AnimatedLogoSplash } from './AnimatedLogoSplash';

export function StartupSplashGate() {
  const [isInitialStartupComplete, setIsInitialStartupComplete] = useState(false);
  const hasRequestedInitialLocationRef = useRef(false);
  const { authState, locationState } = useAuthContext();
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
  const isAuthenticated = authState.status === AUTH_STATUS.AUTHENTICATED;
  const isAuthBootstrapping = authState.status === AUTH_STATUS.BOOTSTRAPPING;
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
  const shouldShowSplash = isAuthBootstrapping || !isLocationSettled;

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

  if (isInitialStartupComplete || !shouldShowSplash) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <AnimatedLogoSplash />
    </View>
  );
}
