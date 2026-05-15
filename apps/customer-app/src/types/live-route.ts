export type RouteCoordinates = {
  latitude: number;
  longitude: number;
};

export type RouteVehicleMode =
  | 'WALK'
  | 'CYCLE'
  | 'TWO_WHEELER'
  | 'CAR'
  | 'UNKNOWN';

export type LiveRouteResult = {
  encodedPolyline: string | null;
  coordinates: RouteCoordinates[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  etaText: string | null;
  distanceText: string | null;
  isFallback: boolean;
};

export type GoogleRouteFetchArgs = {
  apiKey: string;
  origin: RouteCoordinates;
  destination: RouteCoordinates;
  vehicleMode: RouteVehicleMode;
  signal?: AbortSignal;
};

export type GoogleRoutesApiRoute = {
  distanceMeters?: number;
  duration?: string;
  polyline?: {
    encodedPolyline?: string;
  };
};

export type GoogleRoutesApiResponse = {
  routes?: GoogleRoutesApiRoute[];
  error?: {
    message?: string;
  };
};

export type GoogleDirectionsApiLegValue = {
  text?: string;
  value?: number;
};

export type GoogleDirectionsApiLeg = {
  distance?: GoogleDirectionsApiLegValue;
  duration?: GoogleDirectionsApiLegValue;
  duration_in_traffic?: GoogleDirectionsApiLegValue;
};

export type GoogleDirectionsApiRoute = {
  overview_polyline?: {
    points?: string;
  };
  legs?: GoogleDirectionsApiLeg[];
};

export type GoogleDirectionsApiResponse = {
  status?: string;
  error_message?: string;
  routes?: GoogleDirectionsApiRoute[];
};

export type BookingLiveRouteArgs = {
  origin: RouteCoordinates | null;
  destination: RouteCoordinates | null;
  vehicleMode: RouteVehicleMode;
  enabled: boolean;
};

export type BookingLiveRouteState = {
  route: LiveRouteResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};
