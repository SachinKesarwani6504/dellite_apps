export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

export type NormalizedLocation = LocationCoordinates & {
  city: string | null;
  locality: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  formattedAddress: string | null;
};

export type LocationCachePayload = {
  location: NormalizedLocation;
  lastUpdatedAt: string;
};

export type ShouldRefreshLocationArgs = {
  forceRefresh?: boolean;
  hasCachedLocation: boolean;
  lastUpdatedAt?: string | null;
  staleAfterMs: number;
};

export type LocationSnapshot = {
  location: NormalizedLocation | null;
  permissionStatus: LocationPermissionStatus;
  loading: boolean;
  refreshing: boolean;
  initialized: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
};

export type LocationContextValue = LocationSnapshot & {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  formattedAddress: string | null;
  initializeLocation: (options?: { forceRefresh?: boolean }) => Promise<NormalizedLocation | null>;
  refreshLocation: () => Promise<NormalizedLocation | null>;
  requestLocationPermission: () => Promise<LocationPermissionStatus>;
  getCurrentCoordinates: () => Promise<LocationCoordinates>;
  clearLocationError: () => void;
};
