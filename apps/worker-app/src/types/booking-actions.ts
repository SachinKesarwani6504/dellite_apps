import type { BookingDetailsResponse } from '@/types/booking-details';

export type BookingInviteUpdateType = 'ACCEPTED' | 'REJECTED';

export type WorkerAssignmentStatusUpdate =
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type WorkerBookingContactEventType =
  | 'WORKER_CALLED_CUSTOMER'
  | 'WORKER_MESSAGE_SENT';

export type WorkerBookingContactEventPayload = {
  metadata?: Record<string, unknown>;
};

export type WorkerPaymentReceivedMode = 'CASH_TO_WORKER' | 'UPI_TO_WORKER';

export type WorkerPaymentReceivedPayload = {
  mode: WorkerPaymentReceivedMode;
  reference?: string;
};

export type WorkerBookingMutationResponse = BookingDetailsResponse;
