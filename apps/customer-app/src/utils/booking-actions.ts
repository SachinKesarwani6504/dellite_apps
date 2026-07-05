import type {
  BookingDetailsPaymentStatus,
  BookingDetailsResponse,
} from '@/types/booking-details';
import { BOOKING_PAYMENT_STATUS, BOOKING_STATUS } from '@/types/booking';
import { getBookingPaymentInfo, isBookingPaymentSuccessful, normalizeBookingPaymentStatus } from '@/utils/booking-details';

function normalizeStatus(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function canCustomerEditBooking(details: BookingDetailsResponse | null | undefined) {
  const status = normalizeStatus(details?.booking.bookingStatus);
  return status === BOOKING_STATUS.CREATED
    || status === BOOKING_STATUS.SEARCHING
    || status === BOOKING_STATUS.CONFIRMED;
}

export function canCustomerCancelBooking(details: BookingDetailsResponse | null | undefined) {
  const status = normalizeStatus(details?.booking.bookingStatus);
  return status === BOOKING_STATUS.CREATED
    || status === BOOKING_STATUS.SEARCHING
    || status === BOOKING_STATUS.CONFIRMED;
}

export function canCustomerMarkWorkCompleted(details: BookingDetailsResponse | null | undefined) {
  return normalizeStatus(details?.booking.bookingStatus) === BOOKING_STATUS.IN_PROGRESS;
}

export function canCustomerAddTip(details: BookingDetailsResponse | null | undefined) {
  if (normalizeStatus(details?.booking.bookingStatus) !== BOOKING_STATUS.COMPLETED) {
    return false;
  }

  const paymentStatus = getCustomerPaymentStatus(details);
  return !isBookingPaymentSuccessful(paymentStatus);
}

export function getCustomerPaymentStatus(details: BookingDetailsResponse | null | undefined) {
  const paymentInfo = getBookingPaymentInfo(details);
  return normalizeBookingPaymentStatus(paymentInfo?.paymentStatus ?? paymentInfo?.status ?? details?.booking.paymentStatus) as BookingDetailsPaymentStatus | null;
}

export function getCustomerPaymentCopy(status: BookingDetailsPaymentStatus | null) {
  if (status === BOOKING_PAYMENT_STATUS.PENDING) {
    return {
      title: 'Payment confirmation pending',
      description: '',
    };
  }

  if (status === BOOKING_PAYMENT_STATUS.CASH_COLLECTED || status === BOOKING_PAYMENT_STATUS.PAID) {
    return {
      title: 'Payment complete',
      description: '',
    };
  }

  return {
    title: 'Payment details',
    description: '',
  };
}
