import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LOCATION_ERRORS,
  LOCATION_STALE_AFTER_MS,
  MEANINGFUL_LOCATION_CHANGE_METERS,
} from '@/modules/location/constants/location.constants';
import {
  getCurrentCoordinates as getCurrentCoordinatesFromDevice,
  getCurrentLocationDetails,
  getForegroundPermissionStatus,
  requestLocationPermission as requestLocationPermissionFromDevice,
} from '@/modules/location/services/location.service';
import { isMeaningfulLocationChange } from '@/modules/location/utils/distance.util';
import { shouldRefreshLocation } from '@/modules/location/utils/location.mapper';
import type {
  LocationContextValue,
  LocationPermissionStatus,
  LocationSnapshot,
  NormalizedLocation,
} from '@/modules/location/types/location.types';

const initialSnapshot: LocationSnapshot = {
  location: null,
  permissionStatus: 'undetermined',
  loading: false,
  refreshing: false,
  initialized: false,
  error: null,
  lastUpdatedAt: null,
};

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function useLocationController(): LocationContextValue {
  const [snapshot, setSnapshot] = useState<LocationSnapshot>(initialSnapshot);
  const snapshotRef = useRef<LocationSnapshot>(initialSnapshot);
  const initializeInFlightRef = useRef<Promise<NormalizedLocation | null> | null>(null);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const requestLocationPermission = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const status = await requestLocationPermissionFromDevice();
      setSnapshot(current => ({
        ...current,
        permissionStatus: status,
        error: status === 'denied' ? LOCATION_ERRORS.permissionDenied : current.error,
      }));
      return status;
    } catch (error) {
      setSnapshot(current => ({
        ...current,
        permissionStatus: 'denied',
        error: resolveErrorMessage(error, LOCATION_ERRORS.permissionUnavailable),
      }));
      return 'denied';
    }
  }, []);

  const getCurrentCoordinates = useCallback(async () => {
    try {
      return await getCurrentCoordinatesFromDevice();
    } catch (error) {
      throw new Error(resolveErrorMessage(error, LOCATION_ERRORS.fetchFailed));
    }
  }, []);

  const initializeLocation = useCallback(async (options?: { forceRefresh?: boolean }) => {
    if (initializeInFlightRef.current) {
      return initializeInFlightRef.current;
    }

    const runInitialization = async () => {
      const forceRefresh = options?.forceRefresh === true;
      const currentSnapshot = snapshotRef.current;
      const existingLocation = currentSnapshot.location;

      setSnapshot(current => ({
        ...current,
        loading: !current.initialized && !forceRefresh,
        refreshing: current.initialized || forceRefresh,
        error: forceRefresh ? null : current.error,
      }));

      try {
        let permissionStatus = await getForegroundPermissionStatus();

        if (permissionStatus !== 'granted') {
          permissionStatus = await requestLocationPermissionFromDevice();
        }

        if (permissionStatus !== 'granted') {
          setSnapshot(current => ({
            ...current,
            permissionStatus,
            loading: false,
            refreshing: false,
            initialized: true,
            error: LOCATION_ERRORS.permissionDenied,
          }));
          return existingLocation;
        }

        const coordinates = await getCurrentCoordinatesFromDevice();
        const shouldFetch = shouldRefreshLocation({
          forceRefresh,
          hasCachedLocation: Boolean(existingLocation),
          lastUpdatedAt: currentSnapshot.lastUpdatedAt,
          staleAfterMs: LOCATION_STALE_AFTER_MS,
        }) || isMeaningfulLocationChange(existingLocation, coordinates, MEANINGFUL_LOCATION_CHANGE_METERS);

        if (!shouldFetch && existingLocation) {
          setSnapshot(current => ({
            ...current,
            permissionStatus,
            loading: false,
            refreshing: false,
            initialized: true,
            error: null,
          }));
          return existingLocation;
        }

        const locationDetails = await getCurrentLocationDetails(coordinates);
        const now = new Date().toISOString();

        setSnapshot(current => ({
          ...current,
          permissionStatus,
          location: locationDetails,
          lastUpdatedAt: now,
          loading: false,
          refreshing: false,
          initialized: true,
          error: null,
        }));

        return locationDetails;
      } catch (error) {
        setSnapshot(current => ({
          ...current,
          loading: false,
          refreshing: false,
          initialized: true,
          error: resolveErrorMessage(error, LOCATION_ERRORS.fetchFailed),
        }));
        return existingLocation;
      }
    };

    initializeInFlightRef.current = runInitialization().finally(() => {
      initializeInFlightRef.current = null;
    });

    return initializeInFlightRef.current;
  }, []);

  const refreshLocation = useCallback(() => initializeLocation({ forceRefresh: true }), [initializeLocation]);

  const clearLocationError = useCallback(() => {
    setSnapshot(current => ({ ...current, error: null }));
  }, []);

  useEffect(() => {
    void initializeLocation();
  }, [initializeLocation]);

  const location = snapshot.location;

  return useMemo<LocationContextValue>(() => ({
    ...snapshot,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    city: location?.city ?? null,
    locality: location?.locality ?? null,
    state: location?.state ?? null,
    country: location?.country ?? null,
    postalCode: location?.postalCode ?? null,
    formattedAddress: location?.formattedAddress ?? null,
    initializeLocation,
    refreshLocation,
    requestLocationPermission,
    getCurrentCoordinates,
    clearLocationError,
  }), [
    snapshot,
    location,
    initializeLocation,
    refreshLocation,
    requestLocationPermission,
    getCurrentCoordinates,
    clearLocationError,
  ]);
}
