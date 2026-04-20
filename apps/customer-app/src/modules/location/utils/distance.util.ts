import type { LocationCoordinates } from '@/modules/location/types/location.types';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceInMeters(from: LocationCoordinates, to: LocationCoordinates) {
  const latitudeDistance = toRadians(to.latitude - from.latitude);
  const longitudeDistance = toRadians(to.longitude - from.longitude);

  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDistance / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(EARTH_RADIUS_METERS * arc);
}

export function isMeaningfulLocationChange(
  previous: LocationCoordinates | null | undefined,
  next: LocationCoordinates,
  thresholdInMeters: number,
) {
  if (!previous) {
    return true;
  }

  return calculateDistanceInMeters(previous, next) > thresholdInMeters;
}
