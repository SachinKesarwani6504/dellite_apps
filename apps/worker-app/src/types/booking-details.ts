import type { BookingPaymentStatus } from '@/types/booking';

export type BookingDetailsRole = 'CUSTOMER' | 'WORKER';

export type BookingDetailsBookingStatus =
  | 'CREATED'
  | 'SEARCHING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type BookingDetailsPaymentStatus = BookingPaymentStatus;

export type BookingDetailsAssignmentStatus =
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type BookingDetailsPriceType = 'VISIT' | 'HOURLY' | 'DAILY' | 'PER_UNIT';

export type BookingDetailsPriceComputationMode = 'FLAT' | 'PER_BLOCK' | 'PER_MINUTE';

export type BookingDetailsUserImage = {
  id?: string | null;
  url?: string | null;
};

export type BookingDetailsUser = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  profileImageId?: string | null;
  profileImage?: BookingDetailsUserImage | null;
};

export type BookingDetailsCustomerInfo = {
  id?: string | null;
  userId?: string | null;
  user?: BookingDetailsUser | null;
};

export type BookingDetailsWorkerInfo = {
  id?: string | null;
  userId?: string | null;
  currentCityId?: string | null;
  user?: BookingDetailsUser | null;
};

export type BookingDetailsCity = {
  id?: string | null;
  name?: string | null;
  state?: string | null;
  country?: string | null;
};

export type BookingDetailsBooking = {
  id: string;
  bookingCode?: string | null;
  bookingType?: 'INSTANT' | 'SCHEDULED' | null;
  bookingStatus?: BookingDetailsBookingStatus | string | null;
  paymentStatus?: BookingDetailsPaymentStatus | null;
  scheduledStartAt?: string | null;
  subtotalAmount?: string | number | null;
  discountAmount?: string | number | null;
  platformFeeAmount?: string | number | null;
  taxAmount?: string | number | null;
  baseTotalAmount?: string | number | null;
  payableAmount?: string | number | null;
  tipAmount?: string | number | null;
  totalAmount?: string | number | null;
  bookingCommissionAmount?: string | number | null;
  finalCommissionAmount?: string | number | null;
  workerPayoutAmount?: string | number | null;
  notes?: string | null;
  city?: BookingDetailsCity | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type BookingDetailsAddress = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  area?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

export type BookingDetailsSelectedPriceOption = {
  id?: string | null;
  title?: string | null;
  priceType?: BookingDetailsPriceType | string | null;
  price?: string | number | null;
  priceComputationMode?: BookingDetailsPriceComputationMode | string | null;
  estimatedMinutes?: number | null;
  isOptional?: boolean | null;
};

export type BookingDetailsServiceDisplay = {
  key: string;
  title: string;
  subtitle: string;
  selectedValueLabel: string;
  selectedValue: string;
  pricingTitle: string;
  pricingValue: string;
  totalLabel: string;
};

export type BookingDetailsServiceLine = {
  id?: string | null;
  serviceId?: string | null;
  serviceName: string;
  categoryName?: string | null;
  subCategoryName?: string | null;
  quantity?: number | null;
  priceType?: BookingDetailsPriceType | string | null;
  durationLabel?: string | null;
  selectedDurationMinutes?: number | null;
  billableQuantity?: number | null;
  unitPriceAmount?: string | number | null;
  lineSubtotalAmount?: string | number | null;
  lineTotalAmount?: string | number | null;
  selectedPriceOption?: BookingDetailsSelectedPriceOption | null;
};

export type BookingDetailsExtraCharge = {
  id?: string | null;
  bookingServiceLineId?: string | null;
  title?: string | null;
  totalAmount?: string | number | null;
};

export type BookingDetailsDiscount = {
  id?: string | null;
  discountCode?: string | null;
  discountAmount?: string | number | null;
  title?: string | null;
};

export type BookingDetailsHistoryItem = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type BookingDetailsCommission = {
  id?: string | null;
  bookingServiceLineId?: string | null;
  commissionType?: 'PERCENTAGE' | 'FLAT' | string | null;
  commissionValue?: string | number | null;
  baseAmount?: string | number | null;
  commissionAmount?: string | number | null;
};

export type BookingPaymentReviewStatus =
  | 'NONE'
  | 'WAITING_CUSTOMER_PAYMENT'
  | 'WAITING_WORKER_CONFIRMATION'
  | 'WORKER_NOT_RECEIVED'
  | 'PAID';

export type BookingPaymentReview = {
  id?: string | null;
  status?: BookingPaymentReviewStatus | string | null;
  mode?: string | null;
  amount?: string | number | null;
  tipAmount?: string | number | null;
  reference?: string | null;
  note?: string | null;
};

export type BookingPaymentMode =
  | 'CASH_TO_WORKER'
  | 'UPI_TO_WORKER'
  | 'ONLINE_PLATFORM'
  | 'PLATFORM_UPI_QR';

export type BookingPaymentInfo = {
  bookingPaymentId?: string | null;
  paymentId?: string | null;
  paymentMode?: BookingPaymentMode | string | null;
  paymentStatus?: BookingDetailsPaymentStatus | null;
  status?: BookingDetailsPaymentStatus | null;
  mode?: string | null;
  amount?: string | number | null;
  paidAmount?: string | number | null;
  baseTotalAmount?: string | number | null;
  payableAmount?: string | number | null;
  tipAmount?: string | number | null;
  paidAt?: string | null;
};

export type BookingDetailsAssignment = {
  id?: string | null;
  assignmentStatus?: BookingDetailsAssignmentStatus | string | null;
};

export type BookingDetailsPayment = {
  status?: BookingDetailsPaymentStatus | null;
  paymentId?: string | null;
  mode?: string | null;
  paymentMode?: BookingPaymentMode | string | null;
  amount?: string | number | null;
  paidAmount?: string | number | null;
  baseTotalAmount?: string | number | null;
  payableAmount?: string | number | null;
  tipAmount?: string | number | null;
  reference?: string | null;
  paidAt?: string | null;
  canWorkerRecordPayment?: boolean | null;
};

export type BookingDetailsResponse = {
  booking: BookingDetailsBooking;
  customerInfo?: BookingDetailsCustomerInfo | null;
  workerInfo?: BookingDetailsWorkerInfo | null;
  assignment?: BookingDetailsAssignment | null;
  assignments?: BookingDetailsAssignment[];
  invite?: {
    id?: string | null;
    inviteStatus?: string | null;
  } | null;
  address?: BookingDetailsAddress | null;
  serviceLines?: BookingDetailsServiceLine[];
  extraCharges?: BookingDetailsExtraCharge[];
  discounts?: BookingDetailsDiscount[];
  history: BookingDetailsHistoryItem[];
  commissions?: BookingDetailsCommission[];
  paymentReview?: BookingPaymentReview | null;
  payment?: BookingDetailsPayment | null;
  paymentInfo?: BookingPaymentInfo | null;
  workerEarning?: string | number | null;
  commissionDue?: string | number | null;
};

export type BookingServiceLineUpdateInput = {
  serviceName: string;
  quantity?: number;
  actualBillableMinutes?: number;
};

export type UpdateBookingPayload = {
  serviceLineUpdates?: BookingServiceLineUpdateInput[];
};

export type BookingBillLineTone = 'default' | 'positive' | 'primary' | 'caution';

export type BookingBillAmounts = {
  subtotalAmount?: string | number | null;
  platformFeeAmount?: string | number | null;
  taxAmount?: string | number | null;
  discountAmount?: string | number | null;
  bookingTotalAmount?: string | number | null;
  tipAmount?: string | number | null;
  commissionAmount?: string | number | null;
  workerEarningAmount?: string | number | null;
  customerBillAmount?: string | number | null;
  customerPayableAmount?: string | number | null;
};

export type BookingBillSummaryCardProps = {
  title: string;
  amounts: BookingBillAmounts;
};

export type WorkerBillSummaryLines = {
  subtotalAmount: string | number | null;
  tipAmount: string | number | null;
  totalAmount: string | number | null;
  commissionAmount: string | number | null;
  workerEarningAmount: string | number | null;
};

export type BookingPaymentStatusCopy = {
  title: string;
  description: string;
};

export type BookingPaymentBreakdown = {
  billAmount: string | number | null;
  tipAmount: string | number | null;
  receivedAmount: string | number | null;
};

export type BookingPaymentDetailsCardProps = {
  paymentStatus: BookingDetailsPaymentStatus | null;
  payment: BookingPaymentInfo;
  statusCopy: BookingPaymentStatusCopy;
};

export type WorkerBookingDetailsPaymentTabProps = {
  details: BookingDetailsResponse;
  canRecordPayment: boolean;
  jobActionLoading: string | boolean | null;
  onConfirmPaymentReceived: (mode: 'CASH_TO_WORKER' | 'UPI_TO_WORKER') => Promise<boolean>;
};
