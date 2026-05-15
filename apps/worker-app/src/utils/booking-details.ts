import type {
  BookingDetailsAddress,
  BookingDetailsAssignment,
  BookingDetailsResponse,
  BookingDetailsRole,
  BookingDetailsServiceLine,
  BookingDetailsUser,
  UpdateBookingPayload,
} from '@/types/booking-details';
import type { RouteCoordinates } from '@/types/live-route';

export const BOOKING_DURATION_STEP_MINUTES = 30;
export const DEFAULT_BOOKING_DESTINATION_COORDINATES: RouteCoordinates = {
  latitude: 25.4358,
  longitude: 81.8463,
};
export const PREVIEW_WORKER_ROUTE_COORDINATES: RouteCoordinates = {
  latitude: 25.4482,
  longitude: 81.8417,
};

export function getBookingDetailsPath(bookingId: string, role: BookingDetailsRole) {
  return `/booking/${encodeURIComponent(bookingId)}?role=${role}`;
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toLabel(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

export function titleCaseBookingValue(value: string | null | undefined) {
  const normalized = toLabel(value);
  if (!normalized) return '--';
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function formatBookingMoney(value: string | number | null | undefined) {
  const amount = toNumber(value);
  if (amount == null) return '--';
  return `\u20B9${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })}`;
}

export function formatBookingDateTime(value: string | null | undefined) {
  const normalized = toLabel(value);
  if (!normalized) return 'Instant booking';
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatBookingDuration(minutes: number | null | undefined) {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    return '--';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMinutes}m`;
}

export function formatBookingAddress(address: BookingDetailsAddress | null | undefined) {
  if (!address) return '--';
  return [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.district,
    address.state,
    address.pincode,
  ]
    .map(value => toLabel(value))
    .filter((value): value is string => Boolean(value))
    .join(', ') || '--';
}

export function getBookingDestinationCoordinates(address: BookingDetailsAddress | null | undefined): RouteCoordinates | null {
  const latitude = toNumber(address?.latitude);
  const longitude = toNumber(address?.longitude);
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

export function getBookingMapDestinationCoordinates(address: BookingDetailsAddress | null | undefined): RouteCoordinates {
  return getBookingDestinationCoordinates(address) ?? DEFAULT_BOOKING_DESTINATION_COORDINATES;
}

export function getWorkerRouteOriginCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): RouteCoordinates {
  if (
    typeof latitude === 'number'
    && Number.isFinite(latitude)
    && typeof longitude === 'number'
    && Number.isFinite(longitude)
  ) {
    return { latitude, longitude };
  }

  return PREVIEW_WORKER_ROUTE_COORDINATES;
}

export function getGoogleMapsDirectionsUrl(destination: RouteCoordinates) {
  const query = encodeURIComponent(`${destination.latitude},${destination.longitude}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export function getBookingUserName(user: BookingDetailsUser | null | undefined) {
  const fullName = [user?.firstName, user?.lastName]
    .map(value => toLabel(value))
    .filter((value): value is string => Boolean(value))
    .join(' ');
  return fullName || user?.phone || 'Not assigned';
}

export function getLatestAssignmentStatus(assignments: BookingDetailsAssignment[] | undefined) {
  return assignments?.[0]?.assignmentStatus ?? null;
}

export function getBookingStatusLabel(details: BookingDetailsResponse | null | undefined) {
  return titleCaseBookingValue(details?.booking.bookingStatus ?? getLatestAssignmentStatus(details?.assignments));
}

export function getBookingLineKey(line: BookingDetailsServiceLine) {
  return line.id ?? line.serviceId ?? line.serviceName;
}

export function getBookingLineQuantity(line: BookingDetailsServiceLine) {
  return typeof line.quantity === 'number' && Number.isFinite(line.quantity) && line.quantity > 0
    ? line.quantity
    : 1;
}

export function getBookingLineDurationMinutes(line: BookingDetailsServiceLine) {
  if (typeof line.selectedDurationMinutes === 'number' && Number.isFinite(line.selectedDurationMinutes)) {
    return line.selectedDurationMinutes;
  }
  if (typeof line.billableQuantity === 'number' && Number.isFinite(line.billableQuantity)) {
    return line.billableQuantity;
  }
  if (typeof line.selectedPriceOption?.estimatedMinutes === 'number' && Number.isFinite(line.selectedPriceOption.estimatedMinutes)) {
    return line.selectedPriceOption.estimatedMinutes;
  }
  return null;
}

export function isBookingHourlyLine(line: BookingDetailsServiceLine) {
  return line.priceType === 'HOURLY' || line.selectedPriceOption?.priceType === 'HOURLY';
}

export function buildBookingQuantityPatch(line: BookingDetailsServiceLine, quantity: number): UpdateBookingPayload {
  return {
    serviceLineUpdates: [{
      serviceName: line.serviceName,
      quantity,
    }],
  };
}

export function buildBookingDurationPatch(line: BookingDetailsServiceLine, minutes: number): UpdateBookingPayload {
  return {
    serviceLineUpdates: [{
      serviceName: line.serviceName,
      actualBillableMinutes: minutes,
    }],
  };
}
