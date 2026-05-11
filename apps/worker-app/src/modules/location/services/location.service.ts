import * as ExpoLocation from 'expo-location';
import { normalizeCityName } from '@dellite/app-core';
import {
  CURRENT_POSITION_OPTIONS,
  GOOGLE_GEOCODE_ENDPOINT,
  LAST_KNOWN_POSITION_OPTIONS,
  LOCATION_ERRORS,
} from '@/modules/location/constants/location.constants';
import { mapGoogleGeocodeToNormalizedLocation } from '@/modules/location/utils/location.mapper';
import type {
  LocationCoordinates,
  LocationPermissionStatus,
  NormalizedLocation,
} from '@/modules/location/types/location.types';
import { ENV } from '@/utils/env';

function logLocationDebug(message: string, payload?: unknown) {
  void message;
  void payload;
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableCity(value: string | null | undefined) {
  const normalized = normalizeCityName(value);
  return normalized.length > 0 ? normalized : null;
}

function logReverseGeocodeCity(rawCity: string | null, normalizedCity: string | null) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log('Raw reverse geocode city:', rawCity);
  // eslint-disable-next-line no-console
  console.log('Normalized city:', normalizedCity);
}

function toPermissionStatus(status: ExpoLocation.PermissionStatus): LocationPermissionStatus {
  if (status === ExpoLocation.PermissionStatus.GRANTED) {
    return 'granted';
  }

  if (status === ExpoLocation.PermissionStatus.DENIED) {
    return 'denied';
  }

  return 'undetermined';
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

export async function hasLocationPermission() {
  const permission = await ExpoLocation.getForegroundPermissionsAsync();
  return permission.granted;
}

export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  const permission = await ExpoLocation.requestForegroundPermissionsAsync();
  logLocationDebug('requestLocationPermission', { status: permission.status, granted: permission.granted });
  return toPermissionStatus(permission.status);
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

async function resolveWithExpoReverseGeocode(nextCoordinates: LocationCoordinates): Promise<NormalizedLocation> {
  const reverse = await ExpoLocation.reverseGeocodeAsync(nextCoordinates);
  const first = Array.isArray(reverse) ? reverse[0] : null;
  const rawCity = normalizeNullableText(first?.city) ?? normalizeNullableText(first?.district) ?? normalizeNullableText(first?.subregion);
  const city = normalizeNullableCity(rawCity);
  const rawLocality = normalizeNullableText(first?.city) ?? normalizeNullableText(first?.name);
  const locality = rawLocality === rawCity ? city : rawLocality;
  const state = normalizeNullableText(first?.region);
  const country = normalizeNullableText(first?.country);
  const postalCode = normalizeNullableText(first?.postalCode);
  const street = [first?.street, first?.name].filter(Boolean).join(', ').trim();
  const formattedAddress = street || city || state || null;

  logReverseGeocodeCity(rawCity, city);

  const normalized: NormalizedLocation = {
    ...nextCoordinates,
    city,
    locality,
    state,
    country,
    postalCode,
    formattedAddress,
  };

  logLocationDebug('reverseGeocode:expo', normalized);
  return normalized;
}

export async function getCurrentLocationDetails(
  coordinates?: LocationCoordinates,
): Promise<NormalizedLocation> {
  const nextCoordinates = coordinates ?? await getCurrentCoordinates();
  const apiKey = ENV.GOOGLE_MAPS_API_KEY?.trim() || null;

  if (!apiKey) {
    logLocationDebug('reverseGeocode:google:missingApiKey -> fallback expo');
    return resolveWithExpoReverseGeocode(nextCoordinates);
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
    logLocationDebug('reverseGeocode:google:failed -> fallback expo', error);
    return resolveWithExpoReverseGeocode(nextCoordinates);
  }
}

export async function getForegroundPermissionStatus(): Promise<LocationPermissionStatus> {
  const permission = await ExpoLocation.getForegroundPermissionsAsync();
  return toPermissionStatus(permission.status);
}
