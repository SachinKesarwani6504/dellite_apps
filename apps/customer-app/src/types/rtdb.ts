export type WorkerLive = {
  accuracy: number | null;
  heading: number | null;
  heartbeatAt: number;
  isAvailable: boolean;
  isOnline: boolean;
  lastLocationAt: number | null;
  lat: number | null;
  lng: number | null;
  movementStatus: 'STATIONARY' | 'MOVING' | 'GPS_WEAK' | 'UNKNOWN';
  speed: number | null;
  updatedAt: number;
  vehicleMode: 'WALK' | 'TWO_WHEELER' | 'CAR' | 'UNKNOWN';
  workerId: string;
};

export type UserPresence = {
  appState: 'FOREGROUND' | 'BACKGROUND' | 'OFFLINE';
  isConnected: boolean;
  userId: string;
  lastSeenAt: number;
  disconnectedAt: number | null;
  updatedAt: number;
};
