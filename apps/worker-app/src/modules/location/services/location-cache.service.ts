import * as SecureStore from 'expo-secure-store';
import type { LocationPermissionStatus, NormalizedLocation } from '@/modules/location/types/location.types';

const LOCATION_CACHE_KEY = 'location_cache_v1';

type CachedLocationSnapshot = {
  location: NormalizedLocation;
  lastUpdatedAt: string;
  permissionStatus: LocationPermissionStatus;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNormalizedLocation(value: unknown): NormalizedLocation | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  if (!isFiniteNumber(source.latitude) || !isFiniteNumber(source.longitude)) return null;

  return {
    latitude: source.latitude,
    longitude: source.longitude,
    city: normalizeText(source.city),
    locality: normalizeText(source.locality),
    state: normalizeText(source.state),
    country: normalizeText(source.country),
    postalCode: normalizeText(source.postalCode),
    formattedAddress: normalizeText(source.formattedAddress),
  };
}

function toPermissionStatus(value: unknown): LocationPermissionStatus {
  if (value === 'granted' || value === 'denied' || value === 'undetermined') {
    return value;
  }
  return 'undetermined';
}

export async function getCachedLocationSnapshot(): Promise<CachedLocationSnapshot | null> {
  try {
    const raw = await SecureStore.getItemAsync(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      location?: unknown;
      lastUpdatedAt?: unknown;
      permissionStatus?: unknown;
    };
    const location = toNormalizedLocation(parsed.location);
    if (!location) return null;
    const lastUpdatedAt = typeof parsed.lastUpdatedAt === 'string' ? parsed.lastUpdatedAt : null;
    if (!lastUpdatedAt) return null;

    return {
      location,
      lastUpdatedAt,
      permissionStatus: toPermissionStatus(parsed.permissionStatus),
    };
  } catch {
    return null;
  }
}

export async function saveCachedLocationSnapshot(snapshot: CachedLocationSnapshot): Promise<void> {
  try {
    await SecureStore.setItemAsync(LOCATION_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore cache-write failures to keep location flow resilient.
  }
}
