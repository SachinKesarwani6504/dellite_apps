export type BookingRatingValue = 1 | 2 | 3 | 4 | 5;

export type BookingRatingPayload = {
  rating: BookingRatingValue;
  review?: string;
};

export type BookingRatingSummary = {
  id?: string | null;
  rating?: number | null;
  review?: string | null;
  createdAt?: string | null;
};

export type BookingRatingsInfo = {
  customerRatedWorker?: BookingRatingSummary | null;
  workerRatedCustomer?: BookingRatingSummary | null;
};

export type BookingRatingResponse = {
  id: string;
  bookingId: string;
  rating: number;
  review?: string | null;
  raterRole?: 'CUSTOMER' | 'WORKER' | string;
  ratedRole?: 'CUSTOMER' | 'WORKER' | string;
  createdAt?: string | null;
};

export type BookingRatingSheetContentProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (payload: BookingRatingPayload) => Promise<boolean>;
  scrollToEnd?: (animated?: boolean) => void;
};

export type BookingRatingTarget = 'CUSTOMER_TO_WORKER' | 'WORKER_TO_CUSTOMER';
