import type { BookingSlotValue } from '@/utils/options';
import type { CustomerHomeCategory } from '@/types/customer';

export type BookingFlowSourceType = 'popular_service' | 'category';

export type BookingFlowService = {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
};

export type BookingFlowStartPayload = {
  sourceType: BookingFlowSourceType;
  categoryId?: string;
  service?: BookingFlowService;
};

export type BookingFlowContextType = {
  sourceType: BookingFlowSourceType | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  selectedServices: BookingFlowService[];
  selectedServiceIds: Record<string, true>;
  catalog: CustomerHomeCategory[];
  catalogLoading: boolean;
  catalogError: string | null;
  slotValue: BookingSlotValue;
  slotLabel: string;
  address: string;
  notes: string;
  beginFlow: (payload: BookingFlowStartPayload) => void;
  setCategory: (payload: { id: string; name?: string | null }) => void;
  setSubcategory: (payload: { id: string; name?: string | null }) => void;
  toggleService: (service: BookingFlowService) => void;
  setBookingDetails: (payload: {
    slotValue: BookingSlotValue;
    slotLabel: string;
    address: string;
    notes: string;
  }) => void;
  ensureCatalog: (city: string) => Promise<CustomerHomeCategory[]>;
  refreshCatalog: (city: string) => Promise<CustomerHomeCategory[]>;
  resetFlow: () => void;
};
