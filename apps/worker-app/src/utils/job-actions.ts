import type {
  BookingDetailsPaymentStatus,
  BookingPaymentReviewStatus,
  BookingDetailsResponse,
} from '@/types/booking-details';
import { BOOKING_PAYMENT_STATUS, BOOKING_STATUS, WORKER_JOB_INVITE_STATUS } from '@/types/booking';
import { getBookingPaymentInfo, normalizeBookingPaymentStatus } from '@/utils/booking-details';
import { APP_TEXT } from '@/utils/appText';

function normalizeStatus(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function getWorkerInviteStatus(details: BookingDetailsResponse | null | undefined) {
  return normalizeStatus(details?.invite?.inviteStatus);
}

export function canWorkerCancelBeforeStart(details: BookingDetailsResponse | null | undefined) {
  return details?.booking.bookingStatus === BOOKING_STATUS.CONFIRMED
    && getWorkerInviteStatus(details) === WORKER_JOB_INVITE_STATUS.ACCEPTED;
}

export function canWorkerUpdateProgress(details: BookingDetailsResponse | null | undefined) {
  return details?.booking.bookingStatus === BOOKING_STATUS.IN_PROGRESS;
}

export function getWorkerPaymentStatus(details: BookingDetailsResponse | null | undefined) {
  const paymentInfo = getBookingPaymentInfo(details);
  return normalizeBookingPaymentStatus(paymentInfo?.paymentStatus ?? paymentInfo?.status ?? details?.booking.paymentStatus) as BookingDetailsPaymentStatus | null;
}

export function getWorkerPaymentReviewStatus(details: BookingDetailsResponse | null | undefined) {
  return normalizeStatus(details?.paymentReview?.status) as BookingPaymentReviewStatus | '';
}

export function shouldShowWorkerPaymentRecordSection(details: BookingDetailsResponse | null | undefined) {
  const bookingStatus = normalizeStatus(details?.booking.bookingStatus);
  const paymentStatus = getWorkerPaymentStatus(details);
  if (paymentStatus !== BOOKING_PAYMENT_STATUS.PENDING) return false;
  return bookingStatus === BOOKING_STATUS.IN_PROGRESS || bookingStatus === BOOKING_STATUS.COMPLETED;
}

export function canWorkerRecordPayment(details: BookingDetailsResponse | null | undefined) {
  const bookingStatus = normalizeStatus(details?.booking.bookingStatus);
  const paymentReviewStatus = getWorkerPaymentReviewStatus(details);
  return bookingStatus === BOOKING_STATUS.COMPLETED
    && getWorkerPaymentStatus(details) === BOOKING_PAYMENT_STATUS.PENDING
    && (
      !paymentReviewStatus
      || paymentReviewStatus === 'NONE'
      || paymentReviewStatus === 'WAITING_WORKER_CONFIRMATION'
    );
}

export function getWorkerPaymentRecordDisabledReason(details: BookingDetailsResponse | null | undefined) {
  if (!shouldShowWorkerPaymentRecordSection(details) || canWorkerRecordPayment(details)) return null;
  if (normalizeStatus(details?.booking.bookingStatus) === BOOKING_STATUS.IN_PROGRESS) {
    return APP_TEXT.jobs.paymentReceivedCustomerPending;
  }
  return null;
}

export function getWorkerPaymentCopy(status: BookingDetailsPaymentStatus | null) {
  if (status === BOOKING_PAYMENT_STATUS.PENDING) {
    return {
      title: 'Confirm payment received',
      description: '',
    };
  }

  if (status === BOOKING_PAYMENT_STATUS.CASH_COLLECTED || status === BOOKING_PAYMENT_STATUS.PAID) {
    return {
      title: 'Payment confirmed',
      description: '',
    };
  }

  return {
    title: 'Payment details',
    description: '',
  };
}
