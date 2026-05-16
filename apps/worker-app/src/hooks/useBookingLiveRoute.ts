import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchGoogleDriveRoute,
} from '@/utils/live-route';
import type { BookingLiveRouteArgs, BookingLiveRouteState } from '@/types/live-route';
import { APP_TEXT } from '@/utils/appText';
import { ENV } from '@/utils/env';

export function useBookingLiveRoute({
  origin,
  destination,
  vehicleMode,
  enabled,
}: BookingLiveRouteArgs): BookingLiveRouteState {
  const [route, setRoute] = useState<BookingLiveRouteState['route']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRouteRef = useRef(false);
  const originRef = useRef(origin);
  const destinationRef = useRef(destination);

  useEffect(() => {
    originRef.current = origin;
    destinationRef.current = destination;
  }, [
    destination?.latitude,
    destination?.longitude,
    origin?.latitude,
    origin?.longitude,
  ]);

  const refresh = useCallback(async () => {
    const currentOrigin = originRef.current;
    const currentDestination = destinationRef.current;

    if (!enabled || !currentOrigin || !currentDestination) {
      setRoute(null);
      setLoading(false);
      setError(null);
      return;
    }

    hasFetchedRouteRef.current = true;
    const apiKey = ENV.GOOGLE_MAPS_API_KEY?.trim();

    if (!apiKey) {
      setRoute(null);
      setLoading(false);
      setError(`${APP_TEXT.jobs.routeFallback} Missing Google Maps API key.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextRoute = await fetchGoogleDriveRoute({
        apiKey,
        origin: currentOrigin,
        destination: currentDestination,
        vehicleMode,
      });
      setRoute(nextRoute);
    } catch (routeError) {
      const message = routeError instanceof Error && routeError.message.trim()
        ? routeError.message.trim()
        : 'Unknown route error.';
      setRoute(null);
      setError(`${APP_TEXT.jobs.routeFallback} ${message}`);
    } finally {
      setLoading(false);
    }
  }, [enabled, vehicleMode]);

  useEffect(() => {
    if (!enabled) {
      hasFetchedRouteRef.current = false;
      setRoute(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (hasFetchedRouteRef.current || !origin || !destination) return;
    void refresh();
  }, [
    destination,
    enabled,
    origin,
    refresh,
  ]);

  useEffect(() => {
    hasFetchedRouteRef.current = false;
    if (enabled && origin && destination) {
      void refresh();
    }
  }, [vehicleMode]);

  return {
    route,
    loading,
    error,
    refresh,
  };
}
