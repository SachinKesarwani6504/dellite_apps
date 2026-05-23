export type RouteCoordinates = {
  latitude: number;
  longitude: number;
};

export const ROUTE_VEHICLE_MODE = {
  WALK: 'WALK',
  TWO_WHEELER: 'TWO_WHEELER',
  CAR: 'CAR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type RouteVehicleMode =
  (typeof ROUTE_VEHICLE_MODE)[keyof typeof ROUTE_VEHICLE_MODE];

export const WORKER_MOVEMENT_STATUS = {
  STATIONARY: 'STATIONARY',
  MOVING: 'MOVING',
  GPS_WEAK: 'GPS_WEAK',
  UNKNOWN: 'UNKNOWN',
} as const;

export type WorkerMovementStatus =
  (typeof WORKER_MOVEMENT_STATUS)[keyof typeof WORKER_MOVEMENT_STATUS];

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
