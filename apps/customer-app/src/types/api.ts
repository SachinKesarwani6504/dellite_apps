export type ApiMeta = {
  requestId?: string;
  timestamp?: string;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: ApiMeta;
  [key: string]: unknown;
};

export type ApiErrorPayload = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export type ApiToastOptions = {
  enabled?: boolean;
  showSuccess?: boolean;
  showError?: boolean;
  errorMessage?: string;
  successMessage?: string;
  [key: string]: unknown;
};

export type ApiRequestOptions = {
  token?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  toast?: ApiToastOptions;
};

export class ApiError extends Error {
  statusCode: number;
  payload?: unknown;

  constructor(message: string, statusCode: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export type BookingStatus =
  | 'CREATED'
  | 'SEARCHING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface Booking {
  id: string;
  bookingCode?: string | null;
  bookingType?: 'INSTANT' | 'SCHEDULED' | string | null;
  bookingStatus: BookingStatus;
  paymentStatus?: string | null;
  scheduledStartAt?: string | null;
  totalAmount?: string | number | null;
  currency?: 'INR' | string | null;
  services?: BookingListServiceLine[];
  addressSummary?: BookingListAddressSummary | null;
  customerInfo?: BookingListPersonInfo | null;
  workerInfo?: BookingListPersonInfo | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type BookingListServiceLine = {
  id?: string | null;
  serviceName?: string | null;
  category?: string | null;
  subCategory?: string | null;
};

export type CustomerBookingsSummary = {
  allBookings: number;
  ongoingBookings: number;
  completedBookings: number;
};

export type BookingListAddressSummary = {
  area?: string | null;
  addressLine1?: string | null;
  city?: string | null;
};

export type BookingListPersonInfo = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  profileImageUrl?: string | null;
};
