import * as Location from 'expo-location';

export const LOCATION_TRACKING_CONFIG = {
  stationary: {
    maxSpeedMps: 0.5,
    maxDistanceMeters: 10,
  },
  idle: {
    sampling: {
      timeIntervalMs: 10000,
      distanceIntervalMeters: 8,
    },
    slow: {
      minIntervalMs: 30000,
      minDistanceMeters: 20,
      maxSpeedMps: 2,
    },
    fast: {
      minIntervalMs: 15000,
      minDistanceMeters: 20,
    },
    accuracy: Location.Accuracy.Balanced,
  },
  activeBooking: {
    sampling: {
      timeIntervalMs: 5000,
      distanceIntervalMeters: 5,
    },
    slow: {
      minIntervalMs: 10000,
      minDistanceMeters: 10,
      maxSpeedMps: 2,
    },
    fast: {
      minIntervalMs: 5000,
      minDistanceMeters: 10,
    },
    accuracy: Location.Accuracy.Highest,
  },
  heartbeatIntervalMs: 60000,
} as const;

export function resolveWorkerTrackingProfile(activeBookingId: string | null) {
  const profile = activeBookingId ? LOCATION_TRACKING_CONFIG.activeBooking : LOCATION_TRACKING_CONFIG.idle;
  return {
    accuracy: profile.accuracy,
    timeIntervalMs: profile.sampling.timeIntervalMs,
    distanceIntervalMeters: profile.sampling.distanceIntervalMeters,
  };
}

export function shouldSendWorkerLocationUpdate(params: {
  hasPrevious: boolean;
  force: boolean;
  activeBookingId: string | null;
  elapsedMs: number;
  movedMeters: number;
  speedMps: number;
}) {
  if (params.force || !params.hasPrevious) {
    return true;
  }

  const profile = params.activeBookingId
    ? LOCATION_TRACKING_CONFIG.activeBooking
    : LOCATION_TRACKING_CONFIG.idle;

  const isStationary = params.speedMps <= LOCATION_TRACKING_CONFIG.stationary.maxSpeedMps
    && params.movedMeters <= LOCATION_TRACKING_CONFIG.stationary.maxDistanceMeters;
  if (isStationary) {
    return false;
  }

  const speedBand = params.speedMps <= profile.slow.maxSpeedMps ? profile.slow : profile.fast;
  return params.elapsedMs >= speedBand.minIntervalMs
    || params.movedMeters >= speedBand.minDistanceMeters;
}
