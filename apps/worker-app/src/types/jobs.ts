import type { BookingPaymentStatus } from '@/types/booking';

export type WorkerJobBookingStatus =
  | 'CREATED'
  | 'SEARCHING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type WorkerJobInviteStatus =
  | 'NEW_JOB_REQUEST'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type WorkerJobAssignmentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'STARTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type WorkerJobListTab = 'ALL' | 'NEW_JOBS' | 'ONGOING' | 'COMPLETED';

export type WorkerJobsListMode = 'ALL' | 'NEW_JOBS';

export type WorkerJobsSummary = {
  allJobs: number;
  newJobs: number;
  ongoingJobs: number;
  completedJobs: number;
};

export type WorkerJobListItem = {
  booking: {
    id: string;
    bookingCode?: string | null;
    bookingType?: 'INSTANT' | 'SCHEDULED' | null;
    bookingStatus?: WorkerJobBookingStatus | null;
    paymentStatus?: BookingPaymentStatus | null;
    scheduledStartAt?: string | null;
    payableAmount?: string | number | null;
    totalAmount?: string | number | null;
    bookingCommissionAmount?: string | number | null;
    workerPayoutAmount?: string | number | null;
  };
  services?: Array<{
    id?: string;
    serviceName?: string | null;
    category?: string | null;
    subCategory?: string | null;
  }>;
  customerInfo?: {
    id?: string | null;
    userId?: string | null;
    averageRating?: number | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      profileImageUrl?: string | null;
      profileImage?: {
        id?: string | null;
        url?: string | null;
      } | null;
    } | null;
  } | null;
  workerInfo?: {
    id?: string | null;
    userId?: string | null;
    averageRating?: number | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      profileImageUrl?: string | null;
      profileImage?: {
        id?: string | null;
        url?: string | null;
      } | null;
    } | null;
  } | null;
  address?: {
    addressLine1?: string | null;
    area?: string | null;
    district?: string | null;
    state?: string | null;
    pincode?: string | null;
  } | null;
  invite?: {
    inviteStatus?: WorkerJobInviteStatus | null;
  } | null;
  assignments?: Array<{
    assignmentStatus?: WorkerJobAssignmentStatus | null;
  }>;
  commissions?: Array<{
    commissionAmount?: string | number | null;
  }>;
};
