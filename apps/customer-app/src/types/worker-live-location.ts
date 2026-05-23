export type WorkerLiveAppState = 'FOREGROUND' | 'BACKGROUND' | 'INACTIVE';
export type WorkerVehicleMode =
  | 'WALK'
  | 'TWO_WHEELER'
  | 'CAR'
  | 'UNKNOWN';
export type WorkerMovementStatus =
  | 'STATIONARY'
  | 'MOVING'
  | 'GPS_WEAK'
  | 'UNKNOWN';

export type WorkerLiveLocationRecord = {
  workerId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  appState: WorkerLiveAppState;
  lastLocationAt: number;
  heartbeatAt: number;
  isOnline: boolean;
  isAvailable: boolean;
  vehicleMode: WorkerVehicleMode;
  movementStatus: WorkerMovementStatus;
};

export type WorkerLiveLocationState = {
  location: WorkerLiveLocationRecord | null;
  loading: boolean;
  error: string | null;
};

export type WorkerRouteCoordinates = {
  latitude: number;
  longitude: number;
};
