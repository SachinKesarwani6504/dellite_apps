import type {
  GoogleRouteFetchArgs,
  GoogleRoutesApiResponse,
  LiveRouteResult,
  RouteVehicleMode,
  RouteCoordinates,
} from '@/types/live-route';

const GOOGLE_ROUTES_COMPUTE_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GOOGLE_ROUTES_FIELD_MASK = 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline';

function logRouteDebug(message: string, payload?: unknown) {
  console.log(`[booking-route][worker] ${message}`, payload ?? '');
}

function resolveGoogleTravelMode(vehicleMode: RouteVehicleMode) {
  if (vehicleMode === 'WALK') return 'WALK';
  if (vehicleMode === 'TWO_WHEELER') return 'TWO_WHEELER';
  return 'DRIVE';
}

function toDurationSeconds(value: string | null | undefined) {
  if (!value) return null;
  const seconds = Number(value.replace(/s$/i, ''));
  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : null;
}

export function decodeEncodedPolyline(encodedPolyline: string): RouteCoordinates[] {
  const coordinates: RouteCoordinates[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encodedPolyline.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encodedPolyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encodedPolyline.length);

    latitude += (result & 1) ? ~(result >> 1) : (result >> 1);
    result = 0;
    shift = 0;

    do {
      byte = encodedPolyline.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encodedPolyline.length);

    longitude += (result & 1) ? ~(result >> 1) : (result >> 1);
    coordinates.push({
      latitude: latitude / 100000,
      longitude: longitude / 100000,
    });
  }

  return coordinates;
}

export function formatRouteDistance(distanceMeters: number | null | undefined) {
  if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters)) return null;
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters < 10000 ? 1 : 0)} km`;
}

export function formatRouteEta(durationSeconds: number | null | undefined) {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) return null;
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getDistanceInMeters(origin: RouteCoordinates, destination: RouteCoordinates) {
  const radius = 6371000;
  const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
  const dLng = ((destination.longitude - origin.longitude) * Math.PI) / 180;
  const lat1 = (origin.latitude * Math.PI) / 180;
  const lat2 = (destination.latitude * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(radius * c);
}

function getFallbackSpeedMetersPerSecond(vehicleMode: RouteVehicleMode) {
  if (vehicleMode === 'WALK') return 1.4;
  if (vehicleMode === 'TWO_WHEELER') return 8;
  return 10;
}

export function buildFallbackLiveRoute(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
  vehicleMode: RouteVehicleMode = 'CAR',
): LiveRouteResult {
  const distanceMeters = getDistanceInMeters(origin, destination);
  const speed = getFallbackSpeedMetersPerSecond(vehicleMode);
  const durationSeconds = speed > 0 ? Math.max(60, Math.round(distanceMeters / speed)) : null;

  return {
    encodedPolyline: null,
    coordinates: [origin, destination],
    distanceMeters,
    durationSeconds,
    etaText: formatRouteEta(durationSeconds),
    distanceText: formatRouteDistance(distanceMeters),
    isFallback: true,
  };
}

export function getRouteBearingDegrees(origin: RouteCoordinates, destination: RouteCoordinates) {
  const startLatitude = origin.latitude * Math.PI / 180;
  const endLatitude = destination.latitude * Math.PI / 180;
  const longitudeDelta = (destination.longitude - origin.longitude) * Math.PI / 180;
  const y = Math.sin(longitudeDelta) * Math.cos(endLatitude);
  const x = Math.cos(startLatitude) * Math.sin(endLatitude)
    - Math.sin(startLatitude) * Math.cos(endLatitude) * Math.cos(longitudeDelta);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export async function fetchGoogleDriveRoute({
  apiKey,
  origin,
  destination,
  vehicleMode,
  signal,
}: GoogleRouteFetchArgs): Promise<LiveRouteResult> {
  logRouteDebug('start', {
    origin,
    destination,
    vehicleMode,
    hasApiKey: apiKey.trim().length > 0,
  });

  const fallbackModes: RouteVehicleMode[] = vehicleMode === 'CAR'
    ? ['CAR']
    : [vehicleMode, 'CAR'];

  let lastError: Error | null = null;
  for (const mode of fallbackModes) {
    try {
      const route = await fetchGoogleRoutesDriveRoute({
        apiKey,
        origin,
        destination,
        vehicleMode: mode,
        signal,
      });
      logRouteDebug('routes-api:success', {
        mode,
        points: route.coordinates.length,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      });
      return route;
    } catch (routesError) {
      const nextError = routesError instanceof Error ? routesError : new Error('Route unavailable.');
      lastError = nextError;
      logRouteDebug('routes-api:failed', {
        mode,
        message: nextError.message,
      });
    }
  }

  throw lastError ?? new Error('Route unavailable.');
}

async function fetchGoogleRoutesDriveRoute({
  apiKey,
  origin,
  destination,
  vehicleMode,
  signal,
}: GoogleRouteFetchArgs): Promise<LiveRouteResult> {
  const googleTravelMode = resolveGoogleTravelMode(vehicleMode);
  const supportsTrafficPreference = googleTravelMode === 'DRIVE' || googleTravelMode === 'TWO_WHEELER';
  const response = await fetch(GOOGLE_ROUTES_COMPUTE_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': GOOGLE_ROUTES_FIELD_MASK,
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode: googleTravelMode,
      ...(supportsTrafficPreference ? { routingPreference: 'TRAFFIC_AWARE' } : {}),
      computeAlternativeRoutes: false,
      units: 'METRIC',
    }),
  });

  const payload = await response.json() as GoogleRoutesApiResponse;
  logRouteDebug('routes-api:response', {
    ok: response.ok,
    status: response.status,
    routeCount: payload.routes?.length ?? 0,
    errorMessage: payload.error?.message ?? null,
  });

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Route unavailable.');
  }

  const route = payload.routes?.[0];
  const encodedPolyline = route?.polyline?.encodedPolyline ?? null;
  if (!encodedPolyline) {
    throw new Error('Route unavailable.');
  }

  const coordinates = decodeEncodedPolyline(encodedPolyline);
  if (coordinates.length < 2) {
    throw new Error('Route unavailable.');
  }

  const distanceMeters = typeof route?.distanceMeters === 'number' ? route.distanceMeters : null;
  const durationSeconds = toDurationSeconds(route?.duration);

  return {
    encodedPolyline,
    coordinates,
    distanceMeters,
    durationSeconds,
    etaText: formatRouteEta(durationSeconds),
    distanceText: formatRouteDistance(distanceMeters),
    isFallback: false,
  };
}

