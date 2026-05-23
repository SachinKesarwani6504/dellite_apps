import { APP_TEXT } from '@/utils/appText';
import type { CustomerLiveTrackingCardArgs, LiveTrackingCard } from '@/types/live-tracking';
import { ROUTE_VEHICLE_MODE, WORKER_MOVEMENT_STATUS } from '@/types/live-route';

function formatDistanceLabel(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.max(1, Math.round(distanceKm * 1000))} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

function formatArrivalLabel(arrivalMinutes: number) {
  const roundedMinutes = Math.max(1, Math.round(arrivalMinutes));
  if (roundedMinutes < 60) {
    return `Arrives in ${roundedMinutes} min`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return minutes > 0
    ? `Arrives in ${hours} hr ${minutes} min`
    : `Arrives in ${hours} hr`;
}

function buildMovingSubtitle(arrivalMinutes?: number, distanceKm?: number) {
  const parts: string[] = [];

  if (typeof arrivalMinutes === 'number' && Number.isFinite(arrivalMinutes) && arrivalMinutes > 0) {
    parts.push(formatArrivalLabel(arrivalMinutes));
  }

  if (typeof distanceKm === 'number' && Number.isFinite(distanceKm) && distanceKm > 0) {
    parts.push(formatDistanceLabel(distanceKm));
  }

  return parts.join(' • ') || APP_TEXT.main.bookings.liveLocation.movingSubtitleFallback;
}

function getMovingIcon(vehicleMode: CustomerLiveTrackingCardArgs['vehicleMode']): LiveTrackingCard['icon'] {
  if (vehicleMode === ROUTE_VEHICLE_MODE.WALK) return 'walk';
  if (vehicleMode === ROUTE_VEHICLE_MODE.TWO_WHEELER) return 'bike';
  if (vehicleMode === ROUTE_VEHICLE_MODE.CAR) return 'car';
  return 'navigation';
}

function buildStationarySubtitle(distanceKm?: number) {
  if (typeof distanceKm === 'number' && Number.isFinite(distanceKm) && distanceKm > 0) {
    return `${APP_TEXT.main.bookings.liveLocation.stationarySubtitle} • ${formatDistanceLabel(distanceKm)}`;
  }
  return APP_TEXT.main.bookings.liveLocation.stationarySubtitle;
}

export function getCustomerLiveTrackingCard({
  isOnline,
  movementStatus,
  vehicleMode,
  arrivalMinutes,
  distanceKm,
}: CustomerLiveTrackingCardArgs): LiveTrackingCard {
  if (!isOnline) {
    return {
      title: APP_TEXT.main.bookings.liveLocation.offlineTitle,
      subtitle: APP_TEXT.main.bookings.liveLocation.offlineSubtitle,
      icon: 'offline',
      tone: 'offline',
      showLivePill: false,
    };
  }

  if (movementStatus === WORKER_MOVEMENT_STATUS.MOVING) {
    return {
      title: APP_TEXT.main.bookings.liveLocation.movingTitle,
      subtitle: buildMovingSubtitle(arrivalMinutes, distanceKm),
      icon: getMovingIcon(vehicleMode),
      tone: 'success',
      showLivePill: true,
    };
  }

  if (movementStatus === WORKER_MOVEMENT_STATUS.STATIONARY) {
    return {
      title: APP_TEXT.main.bookings.liveLocation.stationaryTitle,
      subtitle: buildStationarySubtitle(distanceKm),
      icon: 'pause',
      tone: 'warning',
      showLivePill: false,
    };
  }

  if (movementStatus === WORKER_MOVEMENT_STATUS.GPS_WEAK) {
    return {
      title: APP_TEXT.main.bookings.liveLocation.weakTitle,
      subtitle: APP_TEXT.main.bookings.liveLocation.weakSubtitle,
      icon: 'gpsWeak',
      tone: 'warning',
      showLivePill: false,
    };
  }

  return {
    title: APP_TEXT.main.bookings.liveLocation.updatingTitle,
    subtitle: APP_TEXT.main.bookings.liveLocation.updatingSubtitle,
    icon: 'refresh',
    tone: 'neutral',
    showLivePill: false,
  };
}
