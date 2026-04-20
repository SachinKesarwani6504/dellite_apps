import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LOCATION_ERRORS,
  LOCATION_STALE_AFTER_MS,
  MEANINGFUL_LOCATION_CHANGE_METERS,
} from '@/modules/location/constants/location.constants';
import { readLocationCache, writeLocationCache } from '@/modules/location/services/location-cache.service';
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
  loading: true,
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
  const initializeInFlightRef = useRef<Promise<NormalizedLocation | null> | null>(null);

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
      const cached = await readLocationCache();
      const forceRefresh = options?.forceRefresh === true;

      if (cached?.location) {
        setSnapshot(current => ({
          ...current,
          location: cached.location,
          lastUpdatedAt: cached.lastUpdatedAt,
          loading: false,
          initialized: true,
        }));
      }

      const isRefreshCycle = cached?.location !== undefined || snapshot.initialized || forceRefresh;
      setSnapshot(current => ({
        ...current,
        loading: !isRefreshCycle,
        refreshing: isRefreshCycle,
        initialized: current.initialized || Boolean(cached?.location),
        error: forceRefresh ? null : current.error,
      }));

      const cachedCoordinates = cached?.location
        ? { latitude: cached.location.latitude, longitude: cached.location.longitude }
        : null;

      try {
        const permissionStatusBeforeRequest = await getForegroundPermissionStatus();

        let permissionStatus = permissionStatusBeforeRequest;
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
          return cached?.location ?? null;
        }

        const coordinates = await getCurrentCoordinatesFromDevice();
        const shouldFetch = shouldRefreshLocation({
          forceRefresh,
          hasCachedLocation: Boolean(cached?.location),
          lastUpdatedAt: cached?.lastUpdatedAt,
          staleAfterMs: LOCATION_STALE_AFTER_MS,
        }) || isMeaningfulLocationChange(cachedCoordinates, coordinates, MEANINGFUL_LOCATION_CHANGE_METERS);

        if (!shouldFetch && cached?.location) {
          setSnapshot(current => ({
            ...current,
            permissionStatus,
            loading: false,
            refreshing: false,
            initialized: true,
            error: null,
          }));
          return cached.location;
        }

        const locationDetails = await getCurrentLocationDetails(coordinates);
        const now = new Date().toISOString();
        await writeLocationCache({ location: locationDetails, lastUpdatedAt: now });

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
        return cached?.location ?? null;
      }
    };

    initializeInFlightRef.current = runInitialization().finally(() => {
      initializeInFlightRef.current = null;
    });

    return initializeInFlightRef.current;
  }, [snapshot.initialized]);

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
