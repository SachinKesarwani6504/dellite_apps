import type { Booking, BookingStatus, CustomerBookingListTab } from '@/types/api';
import { BOOKING_PAYMENT_STATUS, CUSTOMER_BOOKING_TYPE } from '@/types/booking';
import { APP_TEXT } from '@/utils/appText';
import { formatDisplayDateTime } from '@/utils/date-display';
import { theme, uiColors } from '@/utils/theme';
import { extractImageUrl } from '@/utils/media';

export type CustomerBookingStatus = 'ONGOING' | 'COMPLETED';

export type CustomerBookingListItem = {
  id: string;
  serviceTitle: string;
  category: string;
  workerName: string;
  slotLabel: string;
  address: string;
  amountLabel?: string;
  status: CustomerBookingStatus;
  statusLabel: string;
  accentColor: string;
};

export const customerBookingTabs: Array<{ label: string; value: CustomerBookingStatus }> = [
  { label: 'Ongoing', value: 'ONGOING' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const customerBookingsByStatus: Record<CustomerBookingStatus, CustomerBookingListItem[]> = {
  ONGOING: [
    {
      id: 'booking_ongoing_101',
      serviceTitle: 'AC General Service',
      category: 'Home Repair',
      workerName: 'Ravi Kumar',
      slotLabel: 'Today, 4:00 PM - 6:00 PM',
      address: 'Civil Lines, Prayagraj',
      amountLabel: '\u20B9250/hr',
      status: 'ONGOING',
      statusLabel: 'On the Way',
      accentColor: theme.colors.caution,
    },
    {
      id: 'booking_ongoing_102',
      serviceTitle: 'Bathroom Plumbing Repair',
      category: 'Plumbing',
      workerName: 'Imran Ali',
      slotLabel: 'Tomorrow, 10:00 AM - 12:00 PM',
      address: 'Naini, Prayagraj',
      amountLabel: '\u20B9650',
      status: 'ONGOING',
      statusLabel: 'In Progress',
      accentColor: theme.colors.positive,
    },
    {
      id: 'booking_ongoing_103',
      serviceTitle: 'Deep Home Cleaning',
      category: 'Cleaning',
      workerName: 'Sneha Patel',
      slotLabel: 'Tomorrow, 2:00 PM - 5:00 PM',
      address: 'Kareli, Prayagraj',
      amountLabel: '\u20B91,200',
      status: 'ONGOING',
      statusLabel: 'Assigned',
      accentColor: uiColors.status.infoText,
    },
  ],
  COMPLETED: [
    {
      id: 'booking_done_201',
      serviceTitle: 'Kitchen Chimney Cleaning',
      category: 'Cleaning',
      workerName: 'Ajay Yadav',
      slotLabel: '24 Apr, 11:00 AM',
      address: 'Tagore Town, Prayagraj',
      amountLabel: '\u20B9700',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: uiColors.status.infoText,
    },
    {
      id: 'booking_done_202',
      serviceTitle: 'Sofa Shampoo Cleaning',
      category: 'Cleaning',
      workerName: 'Pooja Verma',
      slotLabel: '23 Apr, 6:00 PM',
      address: 'Jhunsi, Prayagraj',
      amountLabel: '\u20B9800',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: uiColors.status.infoText,
    },
    {
      id: 'booking_done_203',
      serviceTitle: 'Water Tank Cleaning',
      category: 'Cleaning',
      workerName: 'Nitesh Singh',
      slotLabel: '21 Apr, 9:00 AM',
      address: 'Phaphamau, Prayagraj',
      amountLabel: '\u20B91,000',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      accentColor: uiColors.status.infoText,
    },
  ],
};

export function findCustomerBookingById(bookingId: string) {
  return Object.values(customerBookingsByStatus)
    .flat()
    .find(booking => booking.id === bookingId) ?? null;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function titleCaseBookingText(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function toBookingAmount(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildCustomerBookingsListPath(params: {
  page: number;
  limit: number;
  tab: CustomerBookingListTab;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page));
  query.set('limit', String(params.limit));

  const includedStatuses: BookingStatus[] = params.tab === 'ONGOING'
    ? ['CREATED', 'SEARCHING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
    : params.tab === 'COMPLETED'
      ? ['COMPLETED']
      : [];
  const includedPaymentStatuses = params.tab === 'ONGOING'
    ? [BOOKING_PAYMENT_STATUS.PENDING]
    : params.tab === 'COMPLETED'
      ? [BOOKING_PAYMENT_STATUS.PAID, BOOKING_PAYMENT_STATUS.CASH_COLLECTED]
      : [];

  includedStatuses.forEach(status => {
    query.append('includeBookingStatus', status);
  });
  includedPaymentStatuses.forEach(status => {
    query.append('bookingPaymentStatus', status);
  });

  return `/bookings?${query.toString()}`;
}

export function getCustomerBookingServiceTitle(booking: Booking) {
  const serviceNames = (booking.services ?? [])
    .map(service => titleCaseBookingText(service.serviceName))
    .filter((value): value is string => Boolean(value));
  if (serviceNames.length === 0) return 'Service Booking';
  if (serviceNames.length === 1) return serviceNames[0];
  return `${serviceNames[0]} +${serviceNames.length - 1}`;
}

export function getCustomerBookingCategoryLabel(booking: Booking) {
  const firstService = booking.services?.[0];
  const category = titleCaseBookingText(firstService?.category);
  const subCategory = titleCaseBookingText(firstService?.subCategory);
  return [category, subCategory].filter(Boolean).join(' / ') || 'Service';
}

export function getCustomerBookingReferenceLabel(booking: Booking) {
  return booking.bookingCode ?? booking.id.slice(0, 8).toUpperCase();
}

export function isCustomerInstantBooking(booking: Booking) {
  return booking.bookingType === CUSTOMER_BOOKING_TYPE.INSTANT;
}

export function getCustomerBookingTypeChipLabel(booking: Booking) {
  if (booking.bookingType === CUSTOMER_BOOKING_TYPE.INSTANT) {
    return APP_TEXT.main.bookingFlow.instantSummaryLabel;
  }
  if (booking.bookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED) {
    return APP_TEXT.main.bookingFlow.scheduledSummaryLabel;
  }
  return titleCaseBookingText(booking.bookingType) ?? 'Booking';
}

export function getCustomerBookingScheduledDateTimeLabel(booking: Booking) {
  if (isCustomerInstantBooking(booking)) {
    return null;
  }

  const scheduledStartAt = normalizeText(booking.scheduledStartAt);
  if (!scheduledStartAt) {
    return APP_TEXT.main.bookings.schedulePendingLabel;
  }

  const parsed = new Date(scheduledStartAt);
  if (Number.isNaN(parsed.getTime())) {
    return scheduledStartAt;
  }

  return formatDisplayDateTime(parsed);
}

export function getCustomerBookingScheduleLabel(booking: Booking) {
  const scheduledDateTime = getCustomerBookingScheduledDateTimeLabel(booking);
  if (scheduledDateTime) {
    return scheduledDateTime;
  }

  if (isCustomerInstantBooking(booking)) {
    return APP_TEXT.main.bookingFlow.instantSummaryLabel;
  }

  return APP_TEXT.main.bookings.schedulePendingLabel;
}

export function getCustomerBookingAddressLabel(booking: Booking) {
  const address = booking.addressSummary;
  if (!address) return 'Address not provided';
  return [address.addressLine1, address.area, address.city]
    .map(value => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .join(', ') || 'Address not provided';
}

export function getCustomerBookingWorkerName(booking: Booking) {
  const worker = booking.workerInfo;
  const user = worker?.user;
  const fullName = [worker?.firstName ?? user?.firstName, worker?.lastName ?? user?.lastName]
    .map(value => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .join(' ');
  return fullName || 'Pending Worker';
}

export function getCustomerBookingWorkerInitial(booking: Booking) {
  return getCustomerBookingWorkerName(booking).charAt(0).toUpperCase() || 'P';
}

export function getCustomerBookingWorkerSubtitle(booking: Booking) {
  return 'Worker';
}

export function getCustomerBookingWorkerAverageRating(booking: Booking) {
  return booking.workerInfo?.averageRating ?? null;
}

export function getCustomerBookingWorkerImageUrl(booking: Booking) {
  const worker = booking.workerInfo;
  const user = worker?.user;
  return extractImageUrl(worker?.profileImage)
    ?? extractImageUrl(user?.profileImage)
    ?? (typeof worker?.profileImageUrl === 'string' ? worker.profileImageUrl.trim() : null)
    ?? (typeof user?.profileImageUrl === 'string' ? user.profileImageUrl.trim() : null);
}

export function getCustomerBookingAmountLabel(booking: Booking) {
  const amount = toBookingAmount(booking.totalAmount);
  if (amount == null) return '--';
  if (booking.currency && booking.currency !== 'INR') {
    return `${booking.currency} ${amount.toLocaleString('en-IN')}`;
  }
  return `\u20B9${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })}`;
}
