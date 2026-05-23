import type { RouteVehicleMode, WorkerMovementStatus } from '@/types/live-route';

export type LiveTrackingIcon =
  | 'walk'
  | 'bike'
  | 'car'
  | 'navigation'
  | 'pause'
  | 'gpsWeak'
  | 'refresh'
  | 'offline';

export type LiveTrackingTone =
  | 'success'
  | 'warning'
  | 'neutral'
  | 'offline';

export type LiveTrackingCard = {
  title: string;
  subtitle: string;
  icon: LiveTrackingIcon;
  tone: LiveTrackingTone;
  showLivePill: boolean;
  actionLabel?: string;
};

export type CustomerLiveTrackingCardArgs = {
  isOnline: boolean;
  movementStatus: WorkerMovementStatus;
  vehicleMode: RouteVehicleMode;
  arrivalMinutes?: number;
  distanceKm?: number;
};
