import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildFallbackLiveRoute,
  fetchGoogleDriveRoute,
} from '@/utils/live-route';
import type { BookingLiveRouteArgs, BookingLiveRouteState } from '@/types/live-route';
import { APP_TEXT } from '@/utils/appText';
import { ENV } from '@/utils/env';
import type { RouteCoordinates } from '@/types/live-route';

const ROUTE_REFRESH_MIN_INTERVAL_MS = 10000;
const ROUTE_REFRESH_MIN_MOVE_METERS = 25;

function calculateHaversineDistanceInMeters(a: RouteCoordinates, b: RouteCoordinates) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const aa = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

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
  const lastFetchAtRef = useRef<number>(0);
  const lastFetchOriginRef = useRef<RouteCoordinates | null>(null);
  const lastFetchDestinationRef = useRef<RouteCoordinates | null>(null);
  const lastFetchVehicleModeRef = useRef(vehicleMode);

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
    lastFetchAtRef.current = Date.now();
    lastFetchOriginRef.current = currentOrigin;
    lastFetchDestinationRef.current = currentDestination;
    lastFetchVehicleModeRef.current = vehicleMode;
    const fallbackRoute = buildFallbackLiveRoute(currentOrigin, currentDestination, vehicleMode);
    const apiKey = ENV.GOOGLE_MAPS_API_KEY?.trim();

    if (!apiKey) {
      console.log('[booking-route][customer] missing-api-key', {
        origin: currentOrigin,
        destination: currentDestination,
      });
      setRoute(fallbackRoute);
      setLoading(false);
      setError(`${APP_TEXT.main.bookings.detailsRouteFallback} Missing Google Maps API key.`);
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
      console.log('[booking-route][customer] fallback', {
        origin: currentOrigin,
        destination: currentDestination,
        message,
      });
      setRoute(fallbackRoute);
      setError(`${APP_TEXT.main.bookings.detailsRouteFallback} ${message}`);
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

  useEffect(() => {
    if (!enabled || !origin || !destination) return;
    if (!hasFetchedRouteRef.current) return;

    const lastOrigin = lastFetchOriginRef.current;
    const lastDestination = lastFetchDestinationRef.current;
    const movedFromLastOrigin = lastOrigin
      ? calculateHaversineDistanceInMeters(lastOrigin, origin)
      : Number.POSITIVE_INFINITY;
    const movedFromLastDestination = lastDestination
      ? calculateHaversineDistanceInMeters(lastDestination, destination)
      : Number.POSITIVE_INFINITY;
    const modeChanged = lastFetchVehicleModeRef.current !== vehicleMode;
    const movementChanged = movedFromLastOrigin >= ROUTE_REFRESH_MIN_MOVE_METERS
      || movedFromLastDestination >= ROUTE_REFRESH_MIN_MOVE_METERS;
    const now = Date.now();
    const elapsedMs = now - lastFetchAtRef.current;
    const canRefreshByInterval = elapsedMs >= ROUTE_REFRESH_MIN_INTERVAL_MS;

    if (modeChanged || (movementChanged && canRefreshByInterval)) {
      void refresh();
    }
  }, [
    destination?.latitude,
    destination?.longitude,
    enabled,
    origin?.latitude,
    origin?.longitude,
    refresh,
    vehicleMode,
  ]);

  return {
    route,
    loading,
    error,
    refresh,
  };
}
