export type WorkerStartBookingWithOtpResponse = {
  success?: boolean;
  message?: string;
  booking?: {
    id?: string;
    bookingStatus?: string;
    status?: string;
    startedAt?: string;
  } | null;
};

