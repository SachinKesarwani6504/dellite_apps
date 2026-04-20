export const LOCATION_CACHE_KEY = '@dellite/location-cache';
export const LOCATION_STALE_AFTER_MS = 10 * 60 * 1000;
export const MEANINGFUL_LOCATION_CHANGE_METERS = 500;

export const LOCATION_ERRORS = {
  permissionDenied: 'Location permission denied. You can continue and set city manually.',
  permissionUnavailable: 'Location permission is unavailable on this device.',
  fetchFailed: 'Unable to fetch your current location right now.',
  reverseGeocodeFailed: 'Unable to resolve address for your location right now.',
} as const;

export const CURRENT_POSITION_OPTIONS = {
  accuracy: 3,
  maximumAge: 45 * 1000,
} as const;

export const LAST_KNOWN_POSITION_OPTIONS = {
  maxAge: 2 * 60 * 1000,
  requiredAccuracy: 100,
} as const;
