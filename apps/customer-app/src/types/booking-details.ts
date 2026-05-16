import type { ReactNode } from 'react';

export type BookingDetailsRole = 'CUSTOMER' | 'WORKER';

export type BookingDetailsBookingStatus =
  | 'CREATED'
  | 'SEARCHING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type BookingDetailsPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
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
  paymentStatus?: BookingDetailsPaymentStatus | string | null;
  scheduledStartAt?: string | null;
  subtotalAmount?: string | number | null;
  discountAmount?: string | number | null;
  platformFeeAmount?: string | number | null;
  taxAmount?: string | number | null;
  totalAmount?: string | number | null;
  bookingCommissionAmount?: string | number | null;
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

export type BookingDetailsResponse = {
  booking: BookingDetailsBooking;
  customerInfo?: BookingDetailsCustomerInfo | null;
  workerInfo?: BookingDetailsWorkerInfo | null;
  address?: BookingDetailsAddress | null;
  serviceLines?: BookingDetailsServiceLine[];
  extraCharges?: BookingDetailsExtraCharge[];
  discounts?: BookingDetailsDiscount[];
  history: BookingDetailsHistoryItem[];
  commissions?: BookingDetailsCommission[];
};

export type BookingServiceLineUpdateInput = {
  serviceName: string;
  quantity?: number;
  actualBillableMinutes?: number;
};

export type UpdateBookingPayload = {
  serviceLineUpdates?: BookingServiceLineUpdateInput[];
};

export type BookingDetailsIconName =
  | 'receipt-outline'
  | 'calendar-outline'
  | 'flash-outline'
  | 'pulse-outline'
  | 'time-outline'
  | 'person-outline'
  | 'location-outline'
  | 'layers-outline'
  | 'pricetag-outline'
  | 'sparkles-outline'
  | 'wallet-outline'
  | 'navigate-outline'
  | 'checkmark-done-outline'
  | 'card-outline';

export type BookingDetailsOverviewChip = {
  key: string;
  value: string;
  iconName: BookingDetailsIconName;
  isWide: boolean;
};

export type BookingDetailsOverviewRow = {
  key: string;
  value: string;
  iconName: BookingDetailsIconName;
};

export type BookingDetailsServiceDisplay = {
  key: string;
  title: string;
  subtitle: string;
  quantityLabel: string;
  durationLabel: string | null;
  pricingTitle: string;
  pricingValue: string;
  totalLabel: string;
  isHourly: boolean;
};

export type BookingDetailsTabValue = 'BILL' | 'SERVICES' | 'LIVE_LOCATION' | 'ASSIGNMENTS' | 'PAYMENT';

export type BookingDetailsTabItem = {
  label: string;
  value: BookingDetailsTabValue;
  iconName: BookingDetailsIconName;
};

export type BookingDetailsTimelineItem = {
  key: string;
  title: string;
  subtitle: string;
};

export type BookingDetailsControllerArgs = {
  bookingId: string;
  role: BookingDetailsRole;
};

export type BookingDetailsContextValue = {
  details: BookingDetailsResponse | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export type BookingDetailsProviderProps = BookingDetailsControllerArgs & {
  children: ReactNode;
};
