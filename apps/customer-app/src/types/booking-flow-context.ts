import type {
  CustomerBookableService,
  CustomerBookingCreateResult,
  CustomerBookingType,
  CustomerHomeCategory,
} from '@/types/customer';

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
  catalog: CustomerHomeCategory[];
  catalogLoading: boolean;
  catalogError: string | null;
  bookingType: CustomerBookingType;
  scheduledDate: string;
  scheduledTime: string;
  address: BookingFlowAddressDraft;
  notes: string;
  beginFlow: (payload: BookingFlowStartPayload) => void;
  setCategory: (payload: { id: string; name?: string | null }) => void;
  setSubcategory: (payload: { id: string; name?: string | null }) => void;
  toggleService: (service: CustomerBookableService) => void;
  resetSelectedServices: () => void;
  clearSubcategorySelection: () => void;
  setServiceQuantity: (serviceId: string, quantity: number) => void;
  setServicePriceOption: (serviceId: string, priceOptionId: string) => void;
  removeService: (serviceId: string) => void;
  setBookingDetails: (payload: BookingFlowDetailsDraft) => void;
  ensureCatalog: (city: string) => Promise<CustomerHomeCategory[]>;
  refreshCatalog: (city: string) => Promise<CustomerHomeCategory[]>;
  createBooking: (city: string) => Promise<CustomerBookingCreateResult>;
  resetFlow: () => void;
};
