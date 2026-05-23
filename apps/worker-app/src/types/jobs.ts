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
    paymentStatus?: string | null;
    scheduledStartAt?: string | null;
    totalAmount?: string | number | null;
    bookingCommissionAmount?: string | number | null;
  };
  services?: Array<{
    id?: string;
    serviceName?: string | null;
    category?: string | null;
    subCategory?: string | null;
  }>;
  customerInfo?: {
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    } | null;
  } | null;
  workerInfo?: {
    userId?: string | null;
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
