import type { BookingDetailsResponse, UpdateBookingPayload } from '@/types/booking-details';

export type CustomerBookingStatusUpdate = 'CANCELLED';

export type BookingContactEventType =
  | 'CUSTOMER_CALLED_WORKER'
  | 'CUSTOMER_MESSAGE_SENT';

export type BookingContactEventPayload = {
  metadata?: Record<string, unknown>;
};

export type CustomerBookingMutationResponse = BookingDetailsResponse;

export type CustomerBookingUpdatePayload = UpdateBookingPayload & {
  scheduledStartAt?: string;
  notes?: string;
};

export type CustomerBookingTipUpdatePayload = {
  tipAmount: number | null;
};
