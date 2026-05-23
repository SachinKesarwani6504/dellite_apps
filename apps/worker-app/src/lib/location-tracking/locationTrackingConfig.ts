import * as Location from 'expo-location';
import type { RouteVehicleMode } from '@/types/live-route';

export type LocationPoint = {
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
};

export const LIVE_LOCATION_CONFIG = {
  // Ignore coarse GPS because it creates fake jumps and noisy Firebase writes.
  MAX_ACCURACY_METERS: 35,

  STOPPED_SPEED: 0.5,
  WALKING_SPEED: 1.6,
  SLOW_MOVING_SPEED: 4.0,
  NORMAL_VEHICLE_SPEED: 8.0,

  // Stopped devices still need a larger movement threshold to avoid GPS drift.
  STOPPED_DISTANCE_M: 7,
  // Walking should feel live on the map without writing every small GPS point.
  WALKING_DISTANCE_M: 8,
  // Slow road movement needs a little more distance before publishing.
  SLOW_MOVING_DISTANCE_M: 12,
  // Normal two-wheeler movement stays smooth while limiting RTDB writes.
  NORMAL_VEHICLE_DISTANCE_M: 18,
  // Fast movement covers distance quickly, so a larger threshold is still responsive.
  FAST_VEHICLE_DISTANCE_M: 25,
  FAST_CAR_DISTANCE_M: 30,
} as const;

export const LOCATION_TRACKING_CONFIG = {
  idle: {
    sampling: {
      distanceIntervalMeters: 1,
    },
    accuracy: Location.Accuracy.Highest,
  },
  activeBooking: {
    sampling: {
      distanceIntervalMeters: 1,
    },
    accuracy: Location.Accuracy.Highest,
  },
} as const;

export function resolveWorkerTrackingProfile(activeBookingId: string | null) {
  const profile = activeBookingId ? LOCATION_TRACKING_CONFIG.activeBooking : LOCATION_TRACKING_CONFIG.idle;
  return {
    accuracy: profile.accuracy,
    distanceIntervalMeters: profile.sampling.distanceIntervalMeters,
  };
}

export function getRequiredDistanceBySpeed(speed: number): number {
  if (speed < LIVE_LOCATION_CONFIG.STOPPED_SPEED) {
    return LIVE_LOCATION_CONFIG.STOPPED_DISTANCE_M;
  }
  if (speed < LIVE_LOCATION_CONFIG.WALKING_SPEED) {
    return LIVE_LOCATION_CONFIG.WALKING_DISTANCE_M;
  }
  if (speed < LIVE_LOCATION_CONFIG.SLOW_MOVING_SPEED) {
    return LIVE_LOCATION_CONFIG.SLOW_MOVING_DISTANCE_M;
  }
  if (speed < LIVE_LOCATION_CONFIG.NORMAL_VEHICLE_SPEED) {
    return LIVE_LOCATION_CONFIG.NORMAL_VEHICLE_DISTANCE_M;
  }
  return LIVE_LOCATION_CONFIG.FAST_VEHICLE_DISTANCE_M;
}

export function applyVehicleModeAdjustment(params: {
  requiredDistance: number;
  speed: number;
  vehicleMode?: RouteVehicleMode;
}): number {
  if (params.vehicleMode === 'WALK') {
    return Math.min(params.requiredDistance, 10);
  }

  if (params.vehicleMode === 'CAR' && params.speed >= LIVE_LOCATION_CONFIG.NORMAL_VEHICLE_SPEED) {
    return LIVE_LOCATION_CONFIG.FAST_CAR_DISTANCE_M;
  }

  return params.requiredDistance;
}

export function inferVehicleModeBySpeed(
  speed: number | null | undefined,
  currentVehicleMode: RouteVehicleMode = 'UNKNOWN',
): RouteVehicleMode {
  if (typeof speed !== 'number' || !Number.isFinite(speed) || speed < LIVE_LOCATION_CONFIG.STOPPED_SPEED) {
    return currentVehicleMode;
  }

  if (speed < LIVE_LOCATION_CONFIG.WALKING_SPEED) {
    return 'WALK';
  }

  if (speed < LIVE_LOCATION_CONFIG.NORMAL_VEHICLE_SPEED) {
    return 'TWO_WHEELER';
  }

  return 'CAR';
}

export function shouldUpdateLiveLocation(params: {
  newLoc: LocationPoint;
  lastSentLoc: LocationPoint | null;
  vehicleMode?: RouteVehicleMode;
}): boolean {
  const accuracy = params.newLoc.accuracy;
  if (typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy > LIVE_LOCATION_CONFIG.MAX_ACCURACY_METERS) {
    return false;
  }

  if (!params.lastSentLoc) {
    return true;
  }

  const distanceMoved = getDistanceInMeters(
    params.lastSentLoc.lat,
    params.lastSentLoc.lng,
    params.newLoc.lat,
    params.newLoc.lng,
  );
  const speed = typeof params.newLoc.speed === 'number' && Number.isFinite(params.newLoc.speed)
    ? Math.max(0, params.newLoc.speed)
    : 0;
  const requiredDistance = applyVehicleModeAdjustment({
    requiredDistance: getRequiredDistanceBySpeed(speed),
    speed,
    vehicleMode: params.vehicleMode,
  });

  return distanceMoved >= requiredDistance;
}

export function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadiusMeters = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
    + Math.cos(phi1) * Math.cos(phi2)
    * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}
