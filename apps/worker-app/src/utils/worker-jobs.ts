import type {
  BookingPaymentStatus,
} from '@/types/booking';
import { BOOKING_PAYMENT_STATUS } from '@/types/booking';
import type {
  WorkerJobBookingStatus,
  WorkerJobInviteStatus,
  WorkerJobListItem,
  WorkerJobListTab,
} from '@/types/jobs';
import { extractImageUrl } from '@/utils';
import { formatDisplayDateTime } from '@/utils/date-display';
import { getBookingPaymentStatusLabel } from '@/utils/booking-details';

export function normalizeWorkerJobListTabForUi(tab: WorkerJobListTab | undefined): WorkerJobListTab {
  if (tab === 'NEW_JOBS' || tab === 'COMPLETED') {
    return tab;
  }
  return 'ALL';
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function titleCaseText(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function toAmount(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatInrAmount(value: number | null) {
  if (value == null) return '--';
  return `\u20B9${value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}`;
}

export function buildWorkerJobsListPath(params: {
  page: number;
  limit: number;
  tab: WorkerJobListTab;
}, options?: {
  disablePaymentStatusFilter?: boolean;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page));
  query.set('limit', String(params.limit));

  const includeBookingStatus: WorkerJobBookingStatus[] = [];
  const excludeBookingStatus: WorkerJobBookingStatus[] = [];
  const includeInviteStatus: WorkerJobInviteStatus[] = [];
  const excludeInviteStatus: WorkerJobInviteStatus[] = [];
  const includePaymentStatus: BookingPaymentStatus[] = [];

  if (params.tab === 'NEW_JOBS') {
    includeInviteStatus.push('NEW_JOB_REQUEST' ,"VIEWED");
  } else if (params.tab === 'ONGOING') {
    includeBookingStatus.push('CREATED', 'SEARCHING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED');
    includeInviteStatus.push('ACCEPTED');
    if (!options?.disablePaymentStatusFilter) {
      includePaymentStatus.push(
        BOOKING_PAYMENT_STATUS.PENDING,
        BOOKING_PAYMENT_STATUS.FAILED,
        BOOKING_PAYMENT_STATUS.REFUND_PENDING,
        BOOKING_PAYMENT_STATUS.REFUNDED,
      );
    }
  } else if (params.tab === 'COMPLETED') {
    includeBookingStatus.push('COMPLETED');
    includeInviteStatus.push('ACCEPTED');
    includePaymentStatus.push(BOOKING_PAYMENT_STATUS.PAID, BOOKING_PAYMENT_STATUS.CASH_COLLECTED);
  } else {
    includeInviteStatus.push('ACCEPTED');
  }

  includeBookingStatus.forEach(value => query.append('includeBookingStatus', value));
  excludeBookingStatus.forEach(value => query.append('excludeBookingStatus', value));
  includeInviteStatus.forEach(value => query.append('includeInviteStatus', value));
  excludeInviteStatus.forEach(value => query.append('excludeInviteStatus', value));
  includePaymentStatus.forEach(value => query.append('bookingPaymentStatus', value));

  return `/jobs?${query.toString()}`;
}

export function getWorkerJobReferenceLabel(item: WorkerJobListItem) {
  return item.booking.bookingCode ?? item.booking.id.slice(0, 8).toUpperCase();
}

export function getWorkerJobServiceTitle(item: WorkerJobListItem) {
  const serviceNames = (item.services ?? [])
    .map(service => titleCaseText(service.serviceName))
    .filter((value): value is string => Boolean(value));
  if (serviceNames.length === 0) return 'Service Job';
  if (serviceNames.length === 1) return serviceNames[0];
  return `${serviceNames[0]} +${serviceNames.length - 1}`;
}

export function getWorkerJobCategoryLabel(item: WorkerJobListItem) {
  const firstService = item.services?.[0];
  const category = titleCaseText(firstService?.category);
  const subCategory = titleCaseText(firstService?.subCategory);
  return [category, subCategory].filter(Boolean).join(' / ') || 'Service';
}

export function getWorkerJobScheduleLabel(item: WorkerJobListItem) {
  const scheduledStartAt = normalizeText(item.booking.scheduledStartAt);
  if (!scheduledStartAt) {
    return item.booking.bookingType === 'INSTANT' ? 'Instant booking' : 'Schedule pending';
  }
  const parsed = new Date(scheduledStartAt);
  if (Number.isNaN(parsed.getTime())) return scheduledStartAt;
  return formatDisplayDateTime(parsed);
}

export function getWorkerJobAddressLabel(item: WorkerJobListItem) {
  const address = item.address;
  if (!address) return 'Address not provided';
  return [address.addressLine1, address.area, address.district, address.state, address.pincode]
    .map(value => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .join(', ') || 'Address not provided';
}

export function getWorkerJobCustomerName(item: WorkerJobListItem) {
  const user = item.customerInfo?.user;
  const fullName = [user?.firstName, user?.lastName]
    .map(value => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .join(' ');
  return fullName || 'Customer';
}

export function getWorkerJobCustomerInitial(item: WorkerJobListItem) {
  return getWorkerJobCustomerName(item).charAt(0).toUpperCase() || 'C';
}

export function getWorkerJobCustomerSubtitle(item: WorkerJobListItem) {
  return 'Customer';
}

export function getWorkerJobCustomerImageUrl(item: WorkerJobListItem) {
  const user = item.customerInfo?.user;
  return extractImageUrl(user?.profileImage)
    ?? (typeof user?.profileImageUrl === 'string' ? user.profileImageUrl.trim() : null);
}

export function getWorkerJobBookingAmountLabel(item: WorkerJobListItem) {
  return formatInrAmount(toAmount(item.booking.payableAmount ?? item.booking.totalAmount));
}

export function getWorkerJobPayoutAmountLabel(item: WorkerJobListItem) {
  return formatInrAmount(toAmount(item.booking.workerPayoutAmount));
}

export function getWorkerJobPaymentStatusLabel(item: WorkerJobListItem) {
  return getBookingPaymentStatusLabel(item.booking.paymentStatus);
}

export function getWorkerJobVisibleServiceLabels(item: WorkerJobListItem) {
  const serviceNames = (item.services ?? [])
    .map(service => titleCaseText(service.serviceName))
    .filter((value): value is string => Boolean(value));
  const visible = serviceNames.slice(0, 2);
  const extraCount = Math.max(0, serviceNames.length - visible.length);
  return { visible, extraCount };
}

export function getWorkerJobStatusLabel(item: WorkerJobListItem) {
  const inviteStatus = item.invite?.inviteStatus;
  const bookingStatus = item.booking.bookingStatus;
  return titleCaseText(inviteStatus ?? bookingStatus) ?? 'Ongoing';
}

export function getWorkerJobStatusBadgeState(item: WorkerJobListItem): 'ONGOING' | 'COMPLETED' | 'CANCELLED' {
  const inviteStatus = item.invite?.inviteStatus;
  const bookingStatus = item.booking.bookingStatus;

  const negativeStatuses: Array<WorkerJobBookingStatus | WorkerJobInviteStatus> = [
    'CANCELLED',
    'EXPIRED',
    'REJECTED',
  ];
  if (
    (bookingStatus && negativeStatuses.includes(bookingStatus))
    || (inviteStatus && negativeStatuses.includes(inviteStatus))
  ) {
    return 'CANCELLED';
  }

  if (bookingStatus === 'COMPLETED') {
    return 'COMPLETED';
  }

  return 'ONGOING';
}
