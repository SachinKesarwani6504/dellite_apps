import { normalizeCityName } from '@dellite/app-core';
import type {
  BookingServiceabilityResult,
  LocationResolutionInput,
  ResolvedProductLocation,
} from '@/modules/location-intelligence/types/location-resolution';
import { toNullableTrimmed, toTitleCase } from '@/modules/location-intelligence/utils/text-normalizer';

function buildComingSoonMessage(displayCity: string) {
  return `Not available in ${displayCity}. Coming soon in your city.`;
}

function toNormalizedCity(value: string | null | undefined) {
  const normalized = normalizeCityName(value);
  return normalized.length > 0 ? normalized : null;
}

export function resolveProductLocation(input: LocationResolutionInput): ResolvedProductLocation {
  const rawCity = toNullableTrimmed(input.city);
  const rawLocality = toNullableTrimmed(input.locality);
  const state = toNullableTrimmed(input.state);
  const formattedAddress = toNullableTrimmed(input.formattedAddress);
  const normalizedCity = toNormalizedCity(rawCity);
  const normalizedLocality = toNormalizedCity(rawLocality);
  const resolvedCity = normalizedCity ?? normalizedLocality;
  const displayCity = toTitleCase(resolvedCity ?? state ?? 'Your Area') || 'Your Area';
  const hasRawCity = Boolean(normalizedCity);
  const hasRawLocality = !hasRawCity && Boolean(normalizedLocality);

  return {
    lat: input.latitude ?? null,
    lng: input.longitude ?? null,
    rawCity,
    rawLocality,
    district: null,
    state,
    resolvedCity,
    displayCity,
    serviceableCity: resolvedCity,
    isServiceable: Boolean(resolvedCity),
    locationSource: hasRawCity ? 'raw_city' : (hasRawLocality ? 'raw_locality' : 'unknown'),
    formattedAddress,
    comingSoonMessage: resolvedCity ? null : buildComingSoonMessage(displayCity),
  };
}

export function resolveBookingServiceability(input: {
  cityCode: ResolvedProductLocation['resolvedCity'];
  locality?: string | null;
  formattedAddress?: string | null;
}): BookingServiceabilityResult {
  const serviceableCity = toNormalizedCity(input.cityCode);
  if (!serviceableCity) {
    return {
      isServiceable: false,
      serviceableCity: null,
      comingSoonMessage: 'Not available in your area. Coming soon in your city.',
    };
  }

  return {
    isServiceable: true,
    serviceableCity,
    comingSoonMessage: null,
  };
}
