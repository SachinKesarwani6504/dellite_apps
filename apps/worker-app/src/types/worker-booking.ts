export type WorkerStartBookingWithOtpResponse = {
  success?: boolean;
  message?: string;
  booking?: {
    id?: string;
    status?: string;
    startedAt?: string;
  } | null;
};

