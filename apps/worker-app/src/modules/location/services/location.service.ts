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
  LocationPermissionStatus,
  NormalizedLocation,
} from '@/modules/location/types/location.types';

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
  return toPermissionStatus(permission.status);
}

export async function getCurrentCoordinates(): Promise<LocationCoordinates> {
  const lastKnownPosition = await ExpoLocation.getLastKnownPositionAsync(LAST_KNOWN_POSITION_OPTIONS);
  if (lastKnownPosition?.coords) {
    return ensureCoordinates(lastKnownPosition.coords.latitude, lastKnownPosition.coords.longitude);
  }

  const currentPosition = await ExpoLocation.getCurrentPositionAsync(CURRENT_POSITION_OPTIONS);
  return ensureCoordinates(currentPosition.coords.latitude, currentPosition.coords.longitude);
}

export async function getCurrentLocationDetails(
  coordinates?: LocationCoordinates,
): Promise<NormalizedLocation> {
  const nextCoordinates = coordinates ?? await getCurrentCoordinates();
  const runtimeGlobal = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  const apiKey = runtimeGlobal.process?.env?.GOOGLE_MAPS_API_KEY
    ?? runtimeGlobal.process?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(LOCATION_ERRORS.missingGoogleApiKey);
  }

  const params = new URLSearchParams({
    latlng: `${nextCoordinates.latitude},${nextCoordinates.longitude}`,
    key: apiKey,
    language: 'en',
    region: 'in',
  });

  const response = await fetch(`${GOOGLE_GEOCODE_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(LOCATION_ERRORS.reverseGeocodeFailed);
  }

  const payload = await response.json();
  const normalized = mapGoogleGeocodeToNormalizedLocation(payload, nextCoordinates);

  if (!normalized) {
    throw new Error(LOCATION_ERRORS.reverseGeocodeFailed);
  }

  return normalized;
}

export async function getForegroundPermissionStatus(): Promise<LocationPermissionStatus> {
  const permission = await ExpoLocation.getForegroundPermissionsAsync();
  return toPermissionStatus(permission.status);
}
