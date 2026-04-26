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

type GoogleAddressComponent = {
  long_name?: string;
  types?: string[];
};

type GoogleGeocodeResult = {
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
};

type GoogleGeocodePayload = {
  results?: GoogleGeocodeResult[];
};

function getComponentValue(components: GoogleAddressComponent[], preferredTypes: readonly string[]) {
  for (let index = 0; index < preferredTypes.length; index += 1) {
    const targetType = preferredTypes[index];
    const matched = components.find(component => Array.isArray(component.types) && component.types.includes(targetType));
    const value = normalizeText(matched?.long_name);
    if (value) {
      return value;
    }
  }

  return null;
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

export function mapGoogleGeocodeToNormalizedLocation(
  payload: unknown,
  coordinates: LocationCoordinates,
): NormalizedLocation | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source = payload as GoogleGeocodePayload;
  const firstResult = Array.isArray(source.results) ? source.results[0] : undefined;
  const components = Array.isArray(firstResult?.address_components) ? firstResult.address_components : [];

  // Prefer district-level component for "city" to avoid village names becoming display city.
  const district = getComponentValue(components, [
    'administrative_area_level_2',
    'administrative_area_level_3',
  ]);
  const city = getComponentValue(components, [
    'locality',
    'administrative_area_level_3',
  ]);
  const locality = getComponentValue(components, [
    'sublocality',
    'sublocality_level_1',
    'neighborhood',
    'route',
  ]);
  const state = getComponentValue(components, ['administrative_area_level_1']);
  const bestCity = district ?? city ?? locality ?? state;

  return {
    ...coordinates,
    city: bestCity,
    locality: locality ?? city,
    state,
    country: getComponentValue(components, ['country']),
    postalCode: getComponentValue(components, ['postal_code']),
    formattedAddress: normalizeText(firstResult?.formatted_address),
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
