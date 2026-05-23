import { APP_TEXT } from '@/utils/appText';
import type { LiveTrackingCard, WorkerLiveTrackingCardArgs } from '@/types/live-tracking';
import { ROUTE_VEHICLE_MODE, WORKER_MOVEMENT_STATUS } from '@/types/live-route';

function formatDistanceLabel(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.max(1, Math.round(distanceKm * 1000))} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

function getMovingIcon(vehicleMode: WorkerLiveTrackingCardArgs['vehicleMode']): LiveTrackingCard['icon'] {
  if (vehicleMode === ROUTE_VEHICLE_MODE.WALK) return 'walk';
  if (vehicleMode === ROUTE_VEHICLE_MODE.TWO_WHEELER) return 'bike';
  if (vehicleMode === ROUTE_VEHICLE_MODE.CAR) return 'car';
  return 'navigation';
}

export function getWorkerLiveTrackingCard({
  isOnline,
  movementStatus,
  vehicleMode,
  distanceKm,
}: WorkerLiveTrackingCardArgs): LiveTrackingCard {
  if (!isOnline) {
    return {
      title: APP_TEXT.jobs.liveLocation.offlineTitle,
      subtitle: APP_TEXT.jobs.liveLocation.offlineSubtitle,
      icon: 'offline',
      tone: 'offline',
      showLivePill: false,
    };
  }

  if (movementStatus === WORKER_MOVEMENT_STATUS.MOVING) {
    return {
      title: APP_TEXT.jobs.liveLocation.movingTitle,
      subtitle: APP_TEXT.jobs.liveLocation.movingSubtitle,
      icon: getMovingIcon(vehicleMode),
      tone: 'success',
      showLivePill: true,
    };
  }

  if (movementStatus === WORKER_MOVEMENT_STATUS.STATIONARY) {
    const subtitle = typeof distanceKm === 'number' && Number.isFinite(distanceKm) && distanceKm > 0
      ? `${APP_TEXT.jobs.liveLocation.stationarySubtitle} • ${formatDistanceLabel(distanceKm)}`
      : APP_TEXT.jobs.liveLocation.stationarySubtitle;
    return {
      title: APP_TEXT.jobs.liveLocation.stationaryTitle,
      subtitle,
      icon: 'pause',
      tone: 'warning',
      showLivePill: false,
    };
  }

  if (movementStatus === WORKER_MOVEMENT_STATUS.GPS_WEAK) {
    return {
      title: APP_TEXT.jobs.liveLocation.weakTitle,
      subtitle: APP_TEXT.jobs.liveLocation.weakSubtitle,
      icon: 'gpsWeak',
      tone: 'warning',
      showLivePill: false,
    };
  }

  return {
    title: APP_TEXT.jobs.liveLocation.updatingTitle,
    subtitle: APP_TEXT.jobs.liveLocation.updatingSubtitle,
    icon: 'refresh',
    tone: 'neutral',
    showLivePill: false,
  };
}
