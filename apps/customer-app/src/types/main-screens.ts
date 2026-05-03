import type {
  BookingFlowAddressDraft,
  BookingFlowAddressMode,
  BookingFlowSelectedServiceLine,
  BookingFlowSourceType,
} from '@/types/booking-flow-context';
import type {
  CustomerBookableService,
  CustomerCatalogSubcategory,
  CustomerHomeCategory,
  CustomerImageUsageType,
  CustomerBookingType,
} from '@/types/customer';

export type BaseNavigation = {
  navigate: (screen: string, params?: unknown) => void;
};

export type BackNavigation = BaseNavigation & {
  goBack: () => void;
};

export type BookingDetailsNavigation = BackNavigation;

export type BookingConfirmationNavigation = BackNavigation & {
  popToTop: () => void;
  getParent: () => { navigate: (screen: string, params?: unknown) => void } | undefined;
};

export type BookingDetailsScreenProps = {
  navigation: BookingDetailsNavigation;
};

export type BookingConfirmationScreenProps = {
  navigation: BookingConfirmationNavigation;
};

export type AllServicesScreenProps = {
  navigation: BaseNavigation;
};

export type HomeScreenProps = {
  navigation: BaseNavigation;
};

export type CategoryServicesRouteParams = {
  sourceType: BookingFlowSourceType;
  categoryId?: string;
  subcategoryId?: string;
  serviceId?: string;
  city?: string;
};

export type CategoryServicesScreenProps = {
  navigation: BackNavigation;
  route: {
    name: string;
    params: CategoryServicesRouteParams;
  };
};

export type BookingDetailsScreenControllerArgs = {
  onNavigateToConfirmation: () => void;
};

export type BookingDetailsScreenControllerValue = {
  isDark: boolean;
  categoryName: string | null;
  selectedServices: BookingFlowSelectedServiceLine[];
  bookingType: CustomerBookingType;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  addressDraft: BookingFlowAddressDraft;
  selectedDurationByService: Record<string, number>;
  dateChoices: Array<{ value: string; topLabel: string; dayOfMonth: string; monthLabel: string }>;
  timeOptions: string[];
  currentLocationSummary: string;
  currentLocationPrimaryLine: string;
  locationRefreshing: boolean;
  locationError: string | null;
  hasMissingPriceSelection: boolean;
  hasValidSchedule: boolean;
  canReview: boolean;
  setBookingType: (next: CustomerBookingType) => void;
  setScheduledDate: (next: string) => void;
  setScheduledTime: (next: string) => void;
  setNotes: (next: string) => void;
  setAddressMode: (mode: BookingFlowAddressMode) => void;
  setAddressField: (field: keyof BookingFlowAddressDraft, value: string) => void;
  refreshCurrentLocation: () => Promise<void>;
  selectServicePriceOption: (serviceId: string, priceOptionId: string) => void;
  selectServiceDuration: (service: CustomerBookableService, selectedPriceOptionId: string | null, minutes: number) => void;
  decreaseServiceQuantity: (serviceId: string, quantity: number) => void;
  increaseServiceQuantity: (serviceId: string, quantity: number) => void;
  removeSelectedService: (serviceId: string) => void;
  reviewBooking: () => void;
};

export type CategoryServicesScreenControllerArgs = {
  route: CategoryServicesScreenProps['route'];
};

export type CategoryServicesScreenControllerValue = {
  isDark: boolean;
  selectedCity: string;
  displayCityLabel: string;
  showSubcategoryPicker: boolean;
  loading: boolean;
  error: string | null;
  subcategories: CustomerCatalogSubcategory[];
  services: CustomerBookableService[];
  selectedServiceIdSet: Set<string>;
  headerBannerImage: string | null;
  headerBannerTitle: string;
  showInitialLoader: boolean;
  activeCategoryId: string | null;
  activeSubcategory: CustomerCatalogSubcategory | null;
  refresh: () => Promise<void>;
  pickSubcategory: (subcategory: CustomerCatalogSubcategory) => void;
  toggleServiceSelection: (service: CustomerBookableService) => void;
};

export type CategoryCatalogUsageTypes = CustomerImageUsageType[];

export type CategoryMetaPayload = {
  id: string;
  name?: string | null;
};

export type ActiveCategoryState = CustomerHomeCategory | null;
