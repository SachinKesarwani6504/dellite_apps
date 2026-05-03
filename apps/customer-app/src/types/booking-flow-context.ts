import type {
  CustomerBookableService,
  CustomerBookingCreateResult,
  CustomerBookingType,
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

export type BookingFlowContextType = {
  sourceType: BookingFlowSourceType | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  selectedServices: BookingFlowSelectedServiceLine[];
  selectedServiceIds: Record<string, true>;
  bookingType: CustomerBookingType;
  scheduledDate: string;
  scheduledTime: string;
  address: BookingFlowAddressDraft;
  notes: string;
  beginFlow: (payload: BookingFlowStartPayload) => void;
  setCategory: (payload: BookingFlowEntityPayload) => void;
  setSubcategory: (payload: BookingFlowEntityPayload) => void;
  toggleService: (service: CustomerBookableService) => void;
  resetSelectedServices: () => void;
  clearSubcategorySelection: () => void;
  setServiceQuantity: (serviceId: string, quantity: number) => void;
  setServicePriceOption: (serviceId: string, priceOptionId: string) => void;
  removeService: (serviceId: string) => void;
  setBookingDetails: (payload: BookingFlowDetailsDraft) => void;
  createBooking: (city: string) => Promise<CustomerBookingCreateResult>;
  resetFlow: () => void;
};

export type BookingFlowProviderProps = {
  children: ReactNode;
};
