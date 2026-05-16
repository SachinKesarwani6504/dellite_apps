import type {
  BookingDetailsAddress,
  BookingDetailsResponse,
  BookingDetailsRole,
  BookingDetailsServiceLine,
  BookingDetailsOverviewChip,
  BookingDetailsOverviewRow,
  BookingDetailsServiceDisplay,
  BookingDetailsTabItem,
  BookingDetailsTabValue,
  BookingDetailsTimelineItem,
  BookingDetailsUser,
  UpdateBookingPayload,
} from '@/types/booking-details';
import type { WorkerRouteCoordinates } from '@/types/worker-live-location';
import type { WorkerLiveLocationRecord } from '@/types/worker-live-location';

export const BOOKING_DURATION_STEP_MINUTES = 30;

export function getBookingDetailsPath(bookingId: string, role: BookingDetailsRole) {
  const normalizedBookingId = encodeURIComponent(bookingId);
  if (role === 'WORKER') {
    return `/job/${normalizedBookingId}`;
  }
  return `/booking/${normalizedBookingId}`;
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

export function getBookingDestinationCoordinates(address: BookingDetailsAddress | null | undefined): WorkerRouteCoordinates | null {
  const latitude = toNumber(address?.latitude);
  const longitude = toNumber(address?.longitude);
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

export function getBookingMapDestinationCoordinates(address: BookingDetailsAddress | null | undefined): WorkerRouteCoordinates | null {
  return getBookingDestinationCoordinates(address) ?? null;
}

export function getBookingUserName(user: BookingDetailsUser | null | undefined) {
  const fullName = [user?.firstName, user?.lastName]
    .map(value => toLabel(value))
    .filter((value): value is string => Boolean(value))
    .join(' ');
  return fullName || user?.phone || 'Not assigned';
}

export function getBookingUserInitial(user: BookingDetailsUser | null | undefined) {
  const name = getBookingUserName(user);
  return name.trim().charAt(0).toUpperCase() || 'W';
}

export function getBookingDetailsWorkerCardDisplay(details: BookingDetailsResponse | null | undefined) {
  const user = details?.workerInfo?.user;
  const name = details?.workerInfo?.id ? getBookingUserName(user) : null;

  return {
    name,
    initial: name ? getBookingUserInitial(user) : 'W',
    phone: toLabel(user?.phone),
    profileImageUrl: toLabel(user?.profileImage?.url),
  };
}

export function canCallBookingWorker(details: BookingDetailsResponse | null | undefined) {
  if (!details?.workerInfo?.id) return false;
  const bookingStatus = details.booking.bookingStatus;
  return bookingStatus !== 'CANCELLED'
    && bookingStatus !== 'EXPIRED'
    && bookingStatus !== 'CREATED'
    && bookingStatus !== 'SEARCHING';
}

export function getBookingWorkerId(details: BookingDetailsResponse | null | undefined) {
  return details?.workerInfo?.id?.trim() || null;
}

export function canTrackBookingWorker(details: BookingDetailsResponse | null | undefined) {
  if (!details) return false;

  const bookingStatus = details.booking.bookingStatus;
  if (
    bookingStatus === 'CANCELLED'
    || bookingStatus === 'EXPIRED'
    || bookingStatus === 'CREATED'
    || bookingStatus === 'SEARCHING'
  ) {
    return false;
  }

  return Boolean(details.workerInfo?.id);
}

export function getTrackableWorkerCoordinates(workerLocation: WorkerLiveLocationRecord | null): WorkerRouteCoordinates | null {
  if (!workerLocation || !workerLocation.isTrackable) return null;
  return {
    latitude: workerLocation.lat,
    longitude: workerLocation.lng,
  };
}

export function getWorkerRouteMapCenter(
  destinationCoordinates: WorkerRouteCoordinates,
  workerCoordinates: WorkerRouteCoordinates | null,
) {
  if (!workerCoordinates) {
    return destinationCoordinates;
  }

  return {
    latitude: (destinationCoordinates.latitude + workerCoordinates.latitude) / 2,
    longitude: (destinationCoordinates.longitude + workerCoordinates.longitude) / 2,
  };
}

export function getBookingDetailsHeaderSubtitle(details: BookingDetailsResponse | null | undefined) {
  const serviceLines = details?.serviceLines ?? [];
  if (serviceLines.length === 0) return 'Service Booking';
  const firstService = titleCaseBookingValue(serviceLines[0].serviceName);
  return serviceLines.length === 1 ? firstService : `${firstService} +${serviceLines.length - 1}`;
}

export function getBookingDetailsOverviewChips(details: BookingDetailsResponse): BookingDetailsOverviewChip[] {
  const bookingTypeLabel = details.booking.bookingType
    ? titleCaseBookingValue(details.booking.bookingType)
    : 'Instant Booking';
  const bookingCodeLabel = details.booking.bookingCode ?? details.booking.id;
  const chips: BookingDetailsOverviewChip[] = [
    {
      key: 'bookingType',
      value: bookingTypeLabel,
      iconName: details.booking.bookingType === 'SCHEDULED' ? 'calendar-outline' : 'flash-outline',
      isWide: false,
    },
    {
      key: 'reference',
      value: bookingCodeLabel,
      iconName: 'receipt-outline',
      isWide: false,
    },
  ];

  if (details.booking.scheduledStartAt) {
    chips.push({
      key: 'schedule',
      value: formatBookingDateTime(details.booking.scheduledStartAt),
      iconName: 'time-outline',
      isWide: true,
    });
  }

  return chips;
}

export function getBookingDetailsOverviewRows(details: BookingDetailsResponse): BookingDetailsOverviewRow[] {
  return [
    {
      key: 'address',
      value: formatBookingAddress(details.address),
      iconName: 'location-outline',
    },
  ];
}

export function getBookingDetailsServiceDisplay(line: BookingDetailsServiceLine): BookingDetailsServiceDisplay {
  const durationMinutes = getBookingLineDurationMinutes(line);
  const isHourly = isBookingHourlyLine(line);
  const selectedPriceOption = line.selectedPriceOption;
  const priceType = selectedPriceOption?.priceType ?? line.priceType ?? null;
  const pricingTitle = selectedPriceOption?.title?.trim()
    || titleCaseBookingValue(priceType)
    || 'Price';
  const unitPrice = selectedPriceOption?.price ?? line.unitPriceAmount;

  return {
    key: getBookingLineKey(line),
    title: titleCaseBookingValue(line.serviceName),
    subtitle: titleCaseBookingValue(line.categoryName ?? line.subCategoryName),
    quantityLabel: String(getBookingLineQuantity(line)),
    durationLabel: isHourly ? formatBookingDuration(durationMinutes) : null,
    pricingTitle,
    pricingValue: formatBookingMoney(unitPrice),
    totalLabel: formatBookingMoney(line.lineTotalAmount),
    isHourly,
  };
}

export function getBookingDetailsTabs(): BookingDetailsTabItem[] {
  return [
    { label: 'Bill', value: 'BILL', iconName: 'wallet-outline' },
    { label: 'All Services', value: 'SERVICES', iconName: 'sparkles-outline' },
    { label: 'Live Location', value: 'LIVE_LOCATION', iconName: 'navigate-outline' },
    { label: 'History', value: 'ASSIGNMENTS', iconName: 'checkmark-done-outline' },
    { label: 'Payment', value: 'PAYMENT', iconName: 'card-outline' },
  ];
}

export function getBookingDetailsTimelineItems(details: BookingDetailsResponse | null | undefined): BookingDetailsTimelineItem[] {
  return (details?.history ?? []).map((item, index) => ({
    key: item.id ?? `history-${index}`,
    title: titleCaseBookingValue(item.title),
    subtitle: item.description?.trim()
      ? `${item.description.trim()} \u2022 ${formatBookingDateTime(item.createdAt)}`
      : formatBookingDateTime(item.createdAt),
  }));
}

export function getBookingStatusLabel(details: BookingDetailsResponse | null | undefined) {
  return titleCaseBookingValue(details?.booking.bookingStatus);
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
