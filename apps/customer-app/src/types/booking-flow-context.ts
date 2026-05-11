import type {
  CustomerBookableService,
  CustomerBookingCreateResult,
  CustomerBookingType,
  CustomerServicePriceOption,
} from '@/types/customer';
import type { ReactNode } from 'react';

export type BookingFlowSourceType = 'popular_service' | 'category';

export type BookingFlowAddressMode = 'google' | 'pin';

export type BookingFlowAddressDraft = {
  mode: BookingFlowAddressMode;
  country: string;
  state: string;
  district: string;
  area: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
};

export type BookingFlowSelectedServiceLine = {
  service: CustomerBookableService;
  quantity: number;
  selectedPriceOptionId: string | null;
  selectedDurationMinutes: number | null;
};

export type BookingFlowStartPayload = {
  sourceType: BookingFlowSourceType;
  categoryId?: string;
  service?: CustomerBookableService;
};

export type BookingFlowEntityPayload = {
  id: string;
  name?: string | null;
};

export type BookingFlowDetailsDraft = {
  bookingType: CustomerBookingType;
  scheduledDate: string;
  scheduledTime: string;
  address: BookingFlowAddressDraft;
  notes: string;
};

export type BookingFlowQuote = {
  currency: 'INR';
  subtotal: number;
  optionalChargeTotal?: number;
  platformFee: number;
  discountAmount?: number;
  discountTotal: number;
  total: number;
  couponCode: string | null;
  couponDiscount: number;
  discountCodes?: string[];
  discounts?: Array<Record<string, unknown>>;
  isEstimated?: boolean;
  baseSubtotal?: number;
  serviceLines?: BookingFlowQuoteServiceLine[];
  appliedOptionalCharges?: BookingFlowQuoteOptionalChargeLine[];
  possibleOptionalCharges?: BookingFlowQuoteOptionalChargeLine[];
};

export type BookingFlowQuoteOptionalChargeLine = {
  id?: string | null;
  title: string;
  price?: number | null;
  priceComputationMode?: CustomerServicePriceOption['priceComputationMode'];
  billingUnitMinutes?: number | null;
  roundingMode?: CustomerServicePriceOption['roundingMode'];
  minutes?: number | null;
  quantity?: number | null;
  amount: number;
};

export type BookingFlowQuoteServiceLine = {
  serviceId: string;
  serviceName: string;
  selectedPriceOptionId: string | null;
  title?: string | null;
  basePrice: number;
  quantity: number;
  selectedDurationMinutes?: number | null;
  estimatedMinutes?: number | null;
  baseDurationMinutes?: number | null;
  subtotal: number;
  optionalCharges?: BookingFlowQuoteOptionalChargeLine[];
};

export type BookingFlowDraft = {
  sourceType: BookingFlowSourceType | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  selectedServicesById: Record<string, BookingFlowSelectedServiceLine>;
  details: BookingFlowDetailsDraft;
};

export type BookingFlowQuoteSelectedServiceLine = {
  service: Pick<CustomerBookableService, 'id' | 'name'>;
  quantity: number;
  selectedPriceOptionId: string;
  selectedDurationMinutes: number | null;
};

export type BookingFlowQuoteDraft = {
  sourceType: BookingFlowSourceType | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  selectedServicesById: Record<string, BookingFlowQuoteSelectedServiceLine>;
  details: BookingFlowDetailsDraft;
};

export type BookingFlowQuoteRequest = {
  bookingDraft: BookingFlowQuoteDraft;
};

export type BookingFlowQuoteResponse = {
  bookingQuote: BookingFlowQuote;
};

export type BookingFlowContextType = {
  bookingDraft: BookingFlowDraft;
  bookingQuote: BookingFlowQuote | null;
  sourceType: BookingFlowSourceType | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  selectedServices: BookingFlowSelectedServiceLine[];
  selectedServiceIds: Record<string, true>;
  selectedServicesById: Record<string, BookingFlowSelectedServiceLine>;
  bookingType: CustomerBookingType;
  scheduledDate: string;
  scheduledTime: string;
  address: BookingFlowAddressDraft;
  notes: string;
  updateBookingDraft: <Key extends keyof BookingFlowDraft>(key: Key, value: BookingFlowDraft[Key]) => void;
  setBookingQuote: (quote: BookingFlowQuote | null) => void;
  fetchBookingQuote: () => Promise<BookingFlowQuote>;
  beginFlow: (payload: BookingFlowStartPayload) => void;
  setCategory: (payload: BookingFlowEntityPayload) => void;
  setSubcategory: (payload: BookingFlowEntityPayload) => void;
  toggleService: (service: CustomerBookableService) => void;
  resetSelectedServices: () => void;
  clearSubcategorySelection: () => void;
  setServiceQuantity: (serviceId: string, quantity: number) => void;
  setServicePriceOption: (serviceId: string, priceOptionId: string) => void;
  setServiceDuration: (serviceId: string, minutes: number | null) => void;
  removeService: (serviceId: string) => void;
  setBookingAddress: (address: BookingFlowAddressDraft) => void;
  setBookingDetails: (payload: BookingFlowDetailsDraft) => void;
  createBooking: (city: string, idempotencyKey: string) => Promise<CustomerBookingCreateResult>;
  resetFlow: () => void;
};

export type BookingFlowProviderProps = {
  children: ReactNode;
};
