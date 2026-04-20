import { LocationCoordinates, NormalizedLocation, ShouldRefreshLocationArgs } from '@/modules/location/types/location.types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeText(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeCoordinates(payload: unknown): LocationCoordinates | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const coordinates = payload as { latitude?: unknown; longitude?: unknown };
  if (!isFiniteNumber(coordinates.latitude) || !isFiniteNumber(coordinates.longitude)) {
    return null;
  }

  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

export function mapToNormalizedLocation(payload: unknown): NormalizedLocation | null {
  const coordinates = normalizeCoordinates(payload);
  if (!coordinates || !payload || typeof payload !== 'object') {
    return null;
  }

  const source = payload as Record<string, unknown>;
  return {
    ...coordinates,
    city: normalizeText(source.city),
    locality: normalizeText(source.locality),
    state: normalizeText(source.state),
    country: normalizeText(source.country),
    postalCode: normalizeText(source.postalCode),
    formattedAddress: normalizeText(source.formattedAddress),
  };
}

export function shouldRefreshLocation({
  forceRefresh,
  hasCachedLocation,
  lastUpdatedAt,
  staleAfterMs,
}: ShouldRefreshLocationArgs) {
  if (forceRefresh) {
    return true;
  }

  if (!hasCachedLocation) {
    return true;
  }

  if (!lastUpdatedAt) {
    return true;
  }

  const updatedAt = new Date(lastUpdatedAt).getTime();
  if (!Number.isFinite(updatedAt)) {
    return true;
  }

  return Date.now() - updatedAt > staleAfterMs;
}
