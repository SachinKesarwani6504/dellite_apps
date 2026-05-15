export type WorkerLiveAppState = 'FOREGROUND' | 'BACKGROUND' | 'INACTIVE';
export type WorkerVehicleMode =
  | 'WALK'
  | 'CYCLE'
  | 'TWO_WHEELER'
  | 'CAR'
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
  isAvailable: boolean;
  isTrackable: boolean;
  vehicleMode: WorkerVehicleMode;
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
