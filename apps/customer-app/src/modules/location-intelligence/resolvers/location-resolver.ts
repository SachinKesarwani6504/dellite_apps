import { CITY_BY_ALIAS, CITY_BY_CODE } from '@/modules/location-intelligence/config/city-master';
import type {
  BookingServiceabilityResult,
  LocationResolutionInput,
  ResolvedProductLocation,
} from '@/modules/location-intelligence/types/location-resolution';
import { normalizeToken, toNullableTrimmed, toTitleCase } from '@/modules/location-intelligence/utils/text-normalizer';

function findCityByAlias(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  if (!normalized) return null;
  return CITY_BY_ALIAS.get(normalized) ?? null;
}

function findCityFromAddress(formattedAddress: string | null | undefined) {
  const address = toNullableTrimmed(formattedAddress);
  if (!address) return null;
  const normalizedAddress = normalizeToken(address);
  const aliases = Array.from(CITY_BY_ALIAS.keys());
  for (let index = 0; index < aliases.length; index += 1) {
    const alias = aliases[index];
    if (alias.length === 0) continue;
    if (normalizedAddress.includes(alias)) {
      return CITY_BY_ALIAS.get(alias) ?? null;
    }
  }
  return null;
}

function buildComingSoonMessage(displayCity: string) {
  return `Not available in ${displayCity}. Coming soon in your city.`;
}

export function resolveProductLocation(input: LocationResolutionInput): ResolvedProductLocation {
  const rawCity = toNullableTrimmed(input.city);
  const rawLocality = toNullableTrimmed(input.locality);
  const state = toNullableTrimmed(input.state);
  const formattedAddress = toNullableTrimmed(input.formattedAddress);

  const cityFromCity = findCityByAlias(rawCity);
  if (cityFromCity) {
    return {
      lat: input.latitude ?? null,
      lng: input.longitude ?? null,
      rawCity,
      rawLocality,
      district: null,
      state,
      resolvedCity: cityFromCity.code,
      displayCity: cityFromCity.displayName,
      serviceableCity: cityFromCity.code,
      isServiceable: true,
      locationSource: 'city_alias',
      formattedAddress,
      comingSoonMessage: null,
    };
  }

  const cityFromLocality = findCityByAlias(rawLocality);
  if (cityFromLocality) {
    return {
      lat: input.latitude ?? null,
      lng: input.longitude ?? null,
      rawCity,
      rawLocality,
      district: null,
      state,
      resolvedCity: cityFromLocality.code,
      displayCity: cityFromLocality.displayName,
      serviceableCity: cityFromLocality.code,
      isServiceable: true,
      locationSource: 'locality_alias',
      formattedAddress,
      comingSoonMessage: null,
    };
  }

  const cityFromAddress = findCityFromAddress(formattedAddress);
  if (cityFromAddress) {
    return {
      lat: input.latitude ?? null,
      lng: input.longitude ?? null,
      rawCity,
      rawLocality,
      district: null,
      state,
      resolvedCity: cityFromAddress.code,
      displayCity: cityFromAddress.displayName,
      serviceableCity: cityFromAddress.code,
      isServiceable: true,
      locationSource: 'address_alias',
      formattedAddress,
      comingSoonMessage: null,
    };
  }

  const displayCity = toTitleCase(rawCity ?? rawLocality ?? state ?? 'Your Area');
  const hasRawCity = normalizeToken(rawCity).length > 0;
  const hasRawLocality = normalizeToken(rawLocality).length > 0;

  return {
    lat: input.latitude ?? null,
    lng: input.longitude ?? null,
    rawCity,
    rawLocality,
    district: null,
    state,
    resolvedCity: null,
    displayCity,
    serviceableCity: null,
    isServiceable: false,
    locationSource: hasRawCity ? 'raw_city' : (hasRawLocality ? 'raw_locality' : 'unknown'),
    formattedAddress,
    comingSoonMessage: buildComingSoonMessage(displayCity),
  };
}

export function resolveBookingServiceability(input: {
  cityCode: ResolvedProductLocation['resolvedCity'];
  locality?: string | null;
  formattedAddress?: string | null;
}): BookingServiceabilityResult {
  if (!input.cityCode) {
    return {
      isServiceable: false,
      serviceableCity: null,
      comingSoonMessage: 'Not available in your area. Coming soon in your city.',
    };
  }

  const city = CITY_BY_CODE.get(input.cityCode);
  if (!city || !city.bookingEnabled) {
    return {
      isServiceable: false,
      serviceableCity: input.cityCode,
      comingSoonMessage: `Bookings in ${city?.displayName ?? input.cityCode} are coming soon.`,
    };
  }

  const localityToken = normalizeToken(input.locality);
  const addressToken = normalizeToken(input.formattedAddress);
  const launchedLocalityAliases = city.launchedLocalityAliases.map(normalizeToken);
  const isLaunchedLocality = launchedLocalityAliases.some(alias => {
    if (!alias) return false;
    return localityToken.includes(alias) || addressToken.includes(alias);
  });

  if (!isLaunchedLocality) {
    return {
      isServiceable: false,
      serviceableCity: input.cityCode,
      comingSoonMessage: 'Not available in your area. Coming soon in your city.',
    };
  }

  return {
    isServiceable: true,
    serviceableCity: input.cityCode,
    comingSoonMessage: null,
  };
}
