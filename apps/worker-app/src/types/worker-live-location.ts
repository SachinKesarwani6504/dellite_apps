import type { WorkerLive } from '@/types/rtdb';

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

export type WorkerLiveLocationRecord = WorkerLive;

export type WorkerLiveLocationState = {
  location: WorkerLiveLocationRecord | null;
  loading: boolean;
  error: string | null;
};

export type WorkerRouteCoordinates = {
  latitude: number;
  longitude: number;
};
