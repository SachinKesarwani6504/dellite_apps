export type CityCode = 'PRAYAGRAJ' | 'CHITRAKOOT' | 'LUCKNOW' | 'KANPUR';

export type LocationSource =
  | 'city_alias'
  | 'locality_alias'
  | 'address_alias'
  | 'raw_city'
  | 'raw_locality'
  | 'unknown';

export type LocationResolutionInput = {
  city?: string | null;
  locality?: string | null;
  state?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ResolvedProductLocation = {
  lat: number | null;
  lng: number | null;
  rawCity: string | null;
  rawLocality: string | null;
  district: string | null;
  state: string | null;
  resolvedCity: CityCode | null;
  displayCity: string;
  serviceableCity: CityCode | null;
  isServiceable: boolean;
  locationSource: LocationSource;
  formattedAddress: string | null;
  comingSoonMessage: string | null;
};

export type BookingServiceabilityResult = {
  isServiceable: boolean;
  serviceableCity: CityCode | null;
  comingSoonMessage: string | null;
};
