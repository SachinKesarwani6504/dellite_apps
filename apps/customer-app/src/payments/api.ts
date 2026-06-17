import { apiGet, apiPost } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { BookingDetailsResponse } from '@/types/booking-details';
import type { PaymentIntentResponse, PaymentProvider } from '@/payments/types';
import { getBookingDetailsPath } from '@/utils/booking-details';

type BookingPaymentIntentPayload = {
  provider: PaymentProvider;
  couponCode?: string;
};

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

export async function createBookingPaymentIntent(
  bookingId: string,
  payload: BookingPaymentIntentPayload,
): Promise<PaymentIntentResponse> {
  const normalizedBookingId = bookingId.trim();
  if (!normalizedBookingId) {
    throw new Error('Booking id is required.');
  }

  const response = await apiPost<
    ApiEnvelope<PaymentIntentResponse> | PaymentIntentResponse,
    BookingPaymentIntentPayload
  >(
    `/customer/bookings/${encodeURIComponent(normalizedBookingId)}/payment/intents`,
    payload,
    {
      auth: true,
      tokenType: 'access',
      toast: {
        errorTitle: 'Payment unavailable',
      },
    },
  );

  return unwrapData(response);
}

export async function fetchBookingPaymentState(bookingId: string): Promise<BookingDetailsResponse> {
  const normalizedBookingId = bookingId.trim();
  if (!normalizedBookingId) {
    throw new Error('Booking id is required.');
  }

  const response = await apiGet<ApiEnvelope<BookingDetailsResponse> | BookingDetailsResponse>(
    getBookingDetailsPath(normalizedBookingId, 'CUSTOMER'),
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );

  return unwrapData(response);
}
