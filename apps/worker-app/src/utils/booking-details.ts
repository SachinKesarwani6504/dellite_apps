import type {
  BookingBillAmounts,
  BookingDetailsAddress,
  BookingDetailsBooking,
  BookingDetailsResponse,
  BookingDetailsRole,
  BookingDetailsSelectedPriceOption,
  BookingDetailsServiceDisplay,
  BookingDetailsServiceLine,
  BookingDetailsUser,
  BookingPaymentBreakdown,
  BookingPaymentInfo,
  UpdateBookingPayload,
  WorkerBillSummaryLines,
} from '@/types/booking-details';
import { BOOKING_PAYMENT_STATUS } from '@/types/booking';
import type { BookingPaymentStatus } from '@/types/booking';
import type { RouteCoordinates } from '@/types/live-route';
import { extractImageUrl } from '@/utils/media';
import { APP_TEXT } from '@/utils/appText';
import { formatDisplayDateTime } from '@/utils/date-display';
import { getPriceRowTitle } from '@/utils/pricing.utils';
import { formatDurationChip } from '@/utils/service-pricing';

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
  const normalizedBookingId = encodeURIComponent(bookingId);
  if (role === 'WORKER') {
    return `/job/${normalizedBookingId}`;
  }
  return `/booking/${normalizedBookingId}?role=${role}`;
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
  return formatDisplayDateTime(parsed);
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
  return fullName || 'Not assigned';
}

export function getBookingUserInitial(user: BookingDetailsUser | null | undefined) {
  const name = getBookingUserName(user);
  return name.trim().charAt(0).toUpperCase() || 'W';
}

export function getBookingCustomerCardDisplay(details: BookingDetailsResponse | null | undefined) {
  const user = details?.customerInfo?.user;
  const name = user ? getBookingUserName(user) : null;
  return {
    name,
    initial: name ? getBookingUserInitial(user) : 'C',
    profileImageUrl: extractImageUrl(user?.profileImage),
  };
}

export function getBookingStatusLabel(details: BookingDetailsResponse | null | undefined) {
  return titleCaseBookingValue(details?.booking.bookingStatus);
}

export function getBookingDetailsHeaderSubtitle(details: BookingDetailsResponse | null | undefined) {
  const serviceLines = details?.serviceLines ?? [];
  if (serviceLines.length === 0) return 'Service Booking';
  const firstService = titleCaseBookingValue(serviceLines[0].serviceName);
  return serviceLines.length === 1 ? firstService : `${firstService} +${serviceLines.length - 1}`;
}

export function getBookingPaymentInfo(details: BookingDetailsResponse | null | undefined): BookingPaymentInfo | null {
  return details?.paymentInfo ?? details?.payment ?? null;
}

export function getBookingPaymentModeLabel(mode: string | null | undefined) {
  if (!mode) return 'Not paid yet';
  const normalized = mode.trim().toUpperCase();
  if (normalized === 'CASH_TO_WORKER') return 'Cash';
  if (normalized === 'UPI_TO_WORKER') return 'UPI';
  if (normalized === 'ONLINE_PLATFORM') return 'Online';
  if (normalized === 'PLATFORM_UPI_QR') return 'Dellite UPI';
  return titleCaseBookingValue(mode);
}

export function normalizeBookingPaymentStatus(value: string | null | undefined): BookingPaymentStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  const statuses = Object.values(BOOKING_PAYMENT_STATUS) as BookingPaymentStatus[];
  return statuses.includes(normalized as BookingPaymentStatus) ? (normalized as BookingPaymentStatus) : null;
}

export function getBookingPaymentStatusLabel(value: string | null | undefined) {
  const status = normalizeBookingPaymentStatus(value);
  return titleCaseBookingValue(status ?? value);
}

export function isBookingPaymentPending(value: string | null | undefined) {
  return normalizeBookingPaymentStatus(value) === BOOKING_PAYMENT_STATUS.PENDING;
}

export function isBookingPaymentProblem(value: string | null | undefined) {
  const status = normalizeBookingPaymentStatus(value);
  return status === BOOKING_PAYMENT_STATUS.FAILED
    || status === BOOKING_PAYMENT_STATUS.REFUND_PENDING
    || status === BOOKING_PAYMENT_STATUS.REFUNDED;
}

export function isBookingPaymentSuccessful(value: string | null | undefined) {
  const status = normalizeBookingPaymentStatus(value);
  return status === BOOKING_PAYMENT_STATUS.PAID || status === BOOKING_PAYMENT_STATUS.CASH_COLLECTED;
}

export function getBookingDetailsOverviewChips(details: BookingDetailsResponse) {
  const bookingTypeLabel = details.booking.bookingType
    ? titleCaseBookingValue(details.booking.bookingType)
    : 'Instant Booking';
  const bookingCodeLabel = details.booking.bookingCode ?? details.booking.id;
  const chips = [
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

export function getBookingDetailsOverviewRows(details: BookingDetailsResponse) {
  return [
    {
      key: 'address',
      value: formatBookingAddress(details.address),
      iconName: 'location-outline',
    },
  ];
}

export function getBookingDetailsNotes(details: BookingDetailsResponse | null | undefined): string | null {
  const notes = details?.booking?.notes?.trim();
  return notes ? notes : null;
}

function normalizeBookingPriceType(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function shouldAllowBookingDetailsQuantityControl(
  option: BookingDetailsSelectedPriceOption | null | undefined,
) {
  const priceType = normalizeBookingPriceType(option?.priceType ?? null);
  return priceType === 'DAILY' || priceType === 'PER_UNIT';
}

function getBookingDetailsServiceSelectedValue(line: BookingDetailsServiceLine) {
  const selectedOption = line.selectedPriceOption;
  const priceType = normalizeBookingPriceType(selectedOption?.priceType ?? line.priceType);

  if (priceType === 'HOURLY') {
    const durationMinutes = getBookingLineDurationMinutes(line);
    return durationMinutes
      ? {
        label: APP_TEXT.jobs.serviceTabDurationLabel,
        value: formatDurationChip(durationMinutes),
      }
      : null;
  }

  if (shouldAllowBookingDetailsQuantityControl(selectedOption)) {
    return {
      label: APP_TEXT.jobs.serviceTabQuantityLabel,
      value: String(getBookingLineQuantity(line)),
    };
  }

  return null;
}

export function getBookingDetailsServiceDisplay(line: BookingDetailsServiceLine): BookingDetailsServiceDisplay {
  const selectedPriceOption = line.selectedPriceOption;
  const priceType = selectedPriceOption?.priceType ?? line.priceType ?? null;
  const computationMode = selectedPriceOption?.priceComputationMode ?? null;
  const selectedValueRow = getBookingDetailsServiceSelectedValue(line);
  const unitPrice = selectedPriceOption?.price ?? line.unitPriceAmount;

  return {
    key: getBookingLineKey(line),
    title: titleCaseBookingValue(line.serviceName),
    subtitle: titleCaseBookingValue(line.categoryName ?? line.subCategoryName),
    selectedValueLabel: selectedValueRow?.label ?? APP_TEXT.jobs.serviceTabQuantityLabel,
    selectedValue: selectedValueRow?.value ?? String(getBookingLineQuantity(line)),
    pricingTitle: getPriceRowTitle(priceType, computationMode),
    pricingValue: formatBookingMoney(unitPrice),
    totalLabel: formatBookingMoney(line.lineTotalAmount),
  };
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

export function hasBookingMoneyAmount(value: string | number | null | undefined): boolean {
  const amount = toNumber(value);
  return amount != null && amount > 0;
}

export function getBookingBillBookingTotalAmount(
  booking: Pick<BookingDetailsBooking, 'payableAmount' | 'baseTotalAmount' | 'totalAmount' | 'tipAmount'>,
): string | number | null | undefined {
  const payable = toNumber(booking.payableAmount);
  if (payable != null) {
    return booking.payableAmount ?? null;
  }

  const baseTotal = toNumber(booking.baseTotalAmount);
  if (baseTotal != null) {
    return booking.baseTotalAmount ?? null;
  }

  const total = toNumber(booking.totalAmount);
  const tip = toNumber(booking.tipAmount) ?? 0;
  if (total != null && tip > 0) {
    const bookingTotal = total - tip;
    return bookingTotal >= 0 ? bookingTotal : booking.totalAmount;
  }

  return booking.totalAmount ?? null;
}

export function getBookingCustomerPayableAmount(
  booking: Pick<BookingDetailsBooking, 'payableAmount' | 'totalAmount' | 'baseTotalAmount' | 'tipAmount'>,
): string | number | null | undefined {
  const payable = toNumber(booking.payableAmount);
  if (payable != null) {
    return booking.payableAmount ?? null;
  }

  const total = toNumber(booking.totalAmount);
  if (total != null) {
    return booking.totalAmount ?? null;
  }

  const billAmount = toNumber(getBookingBillBookingTotalAmount(booking));
  const tip = toNumber(booking.tipAmount) ?? 0;
  if (billAmount == null) {
    return null;
  }

  return tip > 0 ? billAmount + tip : billAmount;
}

export function resolveBookingBillAmounts(booking: BookingDetailsBooking): BookingBillAmounts {
  const customerBillAmount = getBookingBillBookingTotalAmount(booking);
  return {
    subtotalAmount: booking.subtotalAmount,
    platformFeeAmount: booking.platformFeeAmount,
    taxAmount: booking.taxAmount,
    discountAmount: booking.discountAmount,
    bookingTotalAmount: customerBillAmount,
    tipAmount: booking.tipAmount,
    commissionAmount: booking.finalCommissionAmount,
    workerEarningAmount: booking.workerPayoutAmount,
    customerBillAmount,
    customerPayableAmount: getBookingCustomerPayableAmount(booking),
  };
}

export function resolveWorkerBillSummaryLines(amounts: BookingBillAmounts): WorkerBillSummaryLines {
  const subtotalAmount = amounts.subtotalAmount ?? amounts.customerBillAmount ?? amounts.bookingTotalAmount ?? null;
  const tipAmount = hasBookingMoneyAmount(amounts.tipAmount) ? amounts.tipAmount ?? null : null;
  const subtotal = toNumber(subtotalAmount) ?? 0;
  const tip = toNumber(tipAmount) ?? 0;

  let totalAmount: string | number | null = amounts.customerPayableAmount ?? null;
  if (!hasBookingMoneyAmount(totalAmount)) {
    const combined = subtotal + tip;
    totalAmount = combined > 0 ? combined : subtotalAmount;
  }

  return {
    subtotalAmount,
    tipAmount,
    totalAmount,
    commissionAmount: hasBookingMoneyAmount(amounts.commissionAmount) ? amounts.commissionAmount ?? null : null,
    workerEarningAmount: amounts.workerEarningAmount ?? null,
  };
}

export function resolveBookingPaymentBreakdown(
  payment: Pick<BookingPaymentInfo, 'tipAmount' | 'paidAmount' | 'amount' | 'payableAmount' | 'baseTotalAmount'>,
): BookingPaymentBreakdown {
  const tipAmount = hasBookingMoneyAmount(payment.tipAmount) ? payment.tipAmount ?? null : null;
  const tip = toNumber(tipAmount) ?? 0;
  const baseTotal = toNumber(payment.baseTotalAmount);
  const payable = toNumber(payment.payableAmount);
  const paid = toNumber(payment.paidAmount ?? payment.amount);

  let billAmount: string | number | null = null;
  if (baseTotal != null && baseTotal > 0) {
    billAmount = payment.baseTotalAmount ?? null;
  } else if (payable != null) {
    const bill = payable - tip;
    billAmount = bill >= 0 ? bill : payment.payableAmount ?? null;
  } else if (paid != null && tip > 0) {
    const bill = paid - tip;
    billAmount = bill >= 0 ? bill : null;
  }

  let receivedAmount: string | number | null = payment.paidAmount ?? payment.amount ?? null;
  if (!hasBookingMoneyAmount(receivedAmount) && billAmount != null) {
    const bill = toNumber(billAmount) ?? 0;
    receivedAmount = tip > 0 ? bill + tip : billAmount;
  }

  return { billAmount, tipAmount, receivedAmount };
}
