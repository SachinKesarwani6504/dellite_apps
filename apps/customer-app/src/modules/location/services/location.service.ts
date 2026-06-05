import * as ExpoLocation from 'expo-location';
import {
  CURRENT_POSITION_OPTIONS,
  GOOGLE_GEOCODE_ENDPOINT,
  LAST_KNOWN_POSITION_OPTIONS,
  LOCATION_ERRORS,
} from '@/modules/location/constants/location.constants';
import { mapGoogleGeocodeToNormalizedLocation } from '@/modules/location/utils/location.mapper';
import type {
  LocationCoordinates,
  NormalizedLocation,
} from '@/modules/location/types/location.types';
import { ENV } from '@/utils/env';

function logLocationDebug(message: string, payload?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  if (payload === undefined) {
    console.log(`[location.service] ${message}`);
  } else {
    console.log(`[location.service] ${message}`, payload);
  }
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function ensureCoordinates(latitude?: number, longitude?: number): LocationCoordinates {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(LOCATION_ERRORS.fetchFailed);
  }

  return {
    latitude: latitude as number,
    longitude: longitude as number,
  };
}

export async function getCurrentCoordinates(): Promise<LocationCoordinates> {
  const lastKnownPosition = await ExpoLocation.getLastKnownPositionAsync(LAST_KNOWN_POSITION_OPTIONS);
  if (lastKnownPosition?.coords) {
    const coordinates = ensureCoordinates(lastKnownPosition.coords.latitude, lastKnownPosition.coords.longitude);
    logLocationDebug('getCurrentCoordinates:lastKnown', coordinates);
    return coordinates;
  }

  const currentPosition = await ExpoLocation.getCurrentPositionAsync(CURRENT_POSITION_OPTIONS);
  const coordinates = ensureCoordinates(currentPosition.coords.latitude, currentPosition.coords.longitude);
  logLocationDebug('getCurrentCoordinates:fresh', coordinates);
  return coordinates;
}

export async function getCurrentLocationDetails(
  coordinates?: LocationCoordinates,
): Promise<NormalizedLocation> {
  const nextCoordinates = coordinates ?? await getCurrentCoordinates();
  const apiKey = ENV.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    logLocationDebug('reverseGeocode:google:missingApiKey');
    throw new Error(LOCATION_ERRORS.missingGoogleApiKey);
  }

  const params = new URLSearchParams({
    latlng: `${nextCoordinates.latitude},${nextCoordinates.longitude}`,
    key: apiKey,
    language: 'en',
    region: 'in',
  });

  try {
    const response = await fetch(`${GOOGLE_GEOCODE_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(LOCATION_ERRORS.reverseGeocodeFailed);
    }

    const payload = await response.json();
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[Google Maps API] Raw Geocode Payload:', JSON.stringify(payload, null, 2));
    }

    const normalized = mapGoogleGeocodeToNormalizedLocation(payload, nextCoordinates);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[Google Maps API] Normalized Location:', JSON.stringify(normalized, null, 2));
    }

    if (!normalized) {
      throw new Error(LOCATION_ERRORS.reverseGeocodeFailed);
    }

    logLocationDebug('reverseGeocode:google', normalized);
    return normalized;
  } catch (error) {
    logLocationDebug('reverseGeocode:google:failed', error);
    throw new Error(LOCATION_ERRORS.reverseGeocodeFailed);
  }
}

