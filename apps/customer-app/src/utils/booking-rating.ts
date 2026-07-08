import { BOOKING_PAYMENT_STATUS, BOOKING_STATUS } from '@/types/booking';
import type { BookingDetailsResponse } from '@/types/booking-details';
import type { BookingRatingTarget } from '@/types/booking-rating';

type BookingRatingEligibilityParams = {
  details: BookingDetailsResponse | null | undefined;
  target: BookingRatingTarget;
};

function normalizeStatus(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function isRatingPaymentComplete(value: string | null | undefined) {
  const status = normalizeStatus(value);
  return status === BOOKING_PAYMENT_STATUS.PAID || status === BOOKING_PAYMENT_STATUS.CASH_COLLECTED;
}

export function canRequestBookingRating(details: BookingDetailsResponse | null | undefined) {
  return normalizeStatus(details?.booking.bookingStatus) === BOOKING_STATUS.COMPLETED
    && isRatingPaymentComplete(details?.booking.paymentStatus ?? null);
}

export function hasSubmittedBookingRating({ details, target }: BookingRatingEligibilityParams) {
  if (target === 'CUSTOMER_TO_WORKER') {
    return Boolean(details?.ratings?.customerRatedWorker?.id);
  }
  return Boolean(details?.ratings?.workerRatedCustomer?.id);
}

export function shouldAutoOpenBookingRating(params: BookingRatingEligibilityParams) {
  return canRequestBookingRating(params.details) && !hasSubmittedBookingRating(params);
}
