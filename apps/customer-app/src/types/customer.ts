import type { MultipartFile } from '@/types/http';
import type { Gender, OnboardingFlags } from '@/types/auth';

export type CustomerProfile = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  onboarding: OnboardingFlags;
};

export type UpdateCustomerIdentityPayload = {
  firstName: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  referralCode?: string;
  file?: MultipartFile;
};

export type UpdateCustomerProfilePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  preferredLanguage?: 'EN' | 'HI';
  hasSeenOnboardingWelcomeScreen?: boolean;
  file?: MultipartFile;
};

export type CustomerProfileResponse = {
  profile: CustomerProfile;
};

export type CreateCustomerProfileResponse = {
  profile?: CustomerProfile;
  accessToken: string;
  refreshToken: string;
  firebaseCustomToken?: string;
};

export type CustomerHomeAsset = {
  id?: string;
  filename?: string;
  filepath?: string;
  url?: string;
  fileType?: string;
  usageType?: CustomerImageUsageType | null;
};

export type CustomerImageUsageType =
  | 'MAIN'
  | 'PROFILE_MAIN'
  | 'PROFILE_THUMBNAIL'
  | 'PROFILE_COVER'
  | 'ICON'
  | 'BANNER'
  | 'PLACEHOLDER'
  | 'CUSTOMER_HOME_BANNER'
  | 'WORKER_HOME_BANNER';

export const PRICE_TYPE = {
  VISIT: 'VISIT',
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
  PER_UNIT: 'PER_UNIT',
} as const;

export type PriceType = (typeof PRICE_TYPE)[keyof typeof PRICE_TYPE];

export const PRICE_COMPUTATION_MODE = {
  FLAT: 'FLAT',
  PER_BLOCK: 'PER_BLOCK',
  PER_MINUTE: 'PER_MINUTE',
} as const;

export type PriceComputationMode =
  (typeof PRICE_COMPUTATION_MODE)[keyof typeof PRICE_COMPUTATION_MODE];

export const ROUNDING_MODE = {
  CEIL: 'CEIL',
  FLOOR: 'FLOOR',
  NEAREST: 'NEAREST',
} as const;

export type RoundingMode = (typeof ROUNDING_MODE)[keyof typeof ROUNDING_MODE];

export const SERVICE_TASK_TYPE = {
  INCLUDED: 'INCLUDED',
  EXCLUDED: 'EXCLUDED',
} as const;

export type ServiceTaskType = (typeof SERVICE_TASK_TYPE)[keyof typeof SERVICE_TASK_TYPE];

export const COMMISSION_TYPE = {
  PERCENTAGE: 'PERCENTAGE',
  FLAT: 'FLAT',
} as const;

export type CommissionType = (typeof COMMISSION_TYPE)[keyof typeof COMMISSION_TYPE];

export type CustomerImageCarrier = {
  images?: CustomerHomeAsset[];
  iconImage?: CustomerHomeAsset;
  cardImage?: CustomerHomeAsset;
  bannerImage?: CustomerHomeAsset;
  // Legacy compatibility during backend rollout.
  mainImage?: CustomerHomeAsset;
};

export type CustomerCatalogService = {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  isCertificateRequired?: boolean;
} & CustomerImageCarrier;

export type CustomerServicePriceOption = {
  id: string;
  serviceAvailabilityId?: string;
  title: string;
  description?: string;
  price?: number;
  priceType?: PriceType;
  minMinutes?: number | null;
  maxMinutes?: number | null;
  billingUnitMinutes?: number | null;
  roundingMode?: RoundingMode | null;
  priceComputationMode?: PriceComputationMode | null;
  estimatedMinutes?: number | null;
  isOptional?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerServiceTask = {
  id?: string;
  title: string;
  type?: ServiceTaskType;
  order?: number;
};

export type CustomerCatalogSubcategory = {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  serviceCount?: number | string;
  services?: CustomerCatalogService[];
} & CustomerImageCarrier;

export type CustomerHomeCategory = {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  serviceCount?: number | string;
  subcategories?: CustomerCatalogSubcategory[];
  services?: CustomerCatalogService[];
} & CustomerImageCarrier;

export type CustomerHomeService = {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  isCertificateRequired?: boolean;
  iconImage?: CustomerHomeAsset;
  cardImage?: CustomerHomeAsset;
  bannerImage?: CustomerHomeAsset;
  // Legacy compatibility during backend rollout.
  mainImage?: CustomerHomeAsset;
  category?: CustomerHomeCategory;
  subCategory?: {
    id?: string;
    name?: string;
    description?: string;
    iconText?: string;
  };
};

export type CustomerBookableService = CustomerCatalogService & {
  category?: CustomerHomeCategory;
  subCategory?: CustomerCatalogSubcategory;
  priceOptions?: CustomerServicePriceOption[];
  includedTasks?: CustomerServiceTask[];
  excludedTasks?: CustomerServiceTask[];
};

export type CustomerServicesListQuery = {
  city: string;
  search?: string;
  categoryName?: string;
  serviceName?: string;
  page?: number;
  limit?: number;
  includeCategory?: boolean;
  includeSubcategory?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: CustomerImageUsageType[];
};

export type CustomerServiceListItem = {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  isCertificateRequired?: boolean;
  images?: CustomerHomeAsset[];
  iconImage?: CustomerHomeAsset;
  cardImage?: CustomerHomeAsset;
  bannerImage?: CustomerHomeAsset;
  // Legacy compatibility during backend rollout.
  mainImage?: CustomerHomeAsset;
  category?: CustomerHomeCategory;
  subCategory?: CustomerCatalogSubcategory;
  priceOptions?: CustomerServicePriceOption[];
  includedTasks?: CustomerServiceTask[];
  excludedTasks?: CustomerServiceTask[];
};

export const CUSTOMER_BOOKING_TYPE = {
  INSTANT: 'INSTANT',
  SCHEDULED: 'SCHEDULED',
} as const;

export type CustomerBookingType =
  (typeof CUSTOMER_BOOKING_TYPE)[keyof typeof CUSTOMER_BOOKING_TYPE];

export type CustomerBookingAddressInput = {
  country: string;
  state: string;
  district: string;
  area: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  latitude: number;
  longitude: number;
};

export type CreateCustomerBookingServiceLineInput = {
  serviceId?: string;
  serviceName?: string;
  selectedPriceOptionId?: string;
  quantity: number;
};

export type CreateCustomerBookingPayload = {
  city: string;
  bookingType: CustomerBookingType;
  scheduledStartAt?: string;
  notes?: string;
  address: CustomerBookingAddressInput;
  serviceLines: CreateCustomerBookingServiceLineInput[];
};

export type CustomerBookingCreateResult = {
  booking?: {
    id?: string;
    bookingCode?: string;
    bookingStatus?: string;
  };
  addressSnapshot?: Record<string, unknown>;
  serviceLines?: Array<Record<string, unknown>>;
  workerInvites?: Array<Record<string, unknown>>;
  assignments?: Array<Record<string, unknown>>;
  history?: Array<Record<string, unknown>>;
};

export type CustomerHomeHeader = {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  bannerImageUrl?: string | null;
};

export type CustomerHomeFooter = {
  madeWith?: string;
  from?: string;
  region?: string;
  copyright?: string;
};

export type CustomerHomeSectionType = 'service' | 'category' | string;

export type CustomerHomeWhyDelliteItem = {
  title?: string;
};

export type CustomerHomeServiceSection = {
  title?: string;
  type: 'service';
  data?: CustomerHomeService[];
};

export type CustomerHomeCategorySection = {
  title?: string;
  type: 'category';
  data?: CustomerHomeCategory[];
};

export type CustomerHomeWhyDelliteSection = {
  title?: string;
  type?: Exclude<CustomerHomeSectionType, 'service' | 'category'>;
  data?: CustomerHomeWhyDelliteItem[];
};

export type CustomerHomeContentSection =
  | CustomerHomeServiceSection
  | CustomerHomeCategorySection
  | CustomerHomeWhyDelliteSection;

export type CustomerHomePayload = {
  header?: CustomerHomeHeader;
  content?: CustomerHomeContentSection[];
  popularServices?: CustomerHomeService[];
  allServices?: CustomerHomeCategory[];
  whyDellite?: string[];
  footer?: CustomerHomeFooter;
};

export type CustomerCatalogQuery = {
  city: string;
  categoryName?: string;
  serviceName?: string;
  includeSubcategory?: boolean;
  includeServices?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: CustomerImageUsageType[];
};

export type CustomerCategoryDetailQuery = {
  city: string;
  includeSubcategory?: boolean;
  includeServices?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: CustomerImageUsageType[];
};

export type CustomerSubcategoryListQuery = {
  city: string;
  search?: string;
  categoryName?: string;
  serviceName?: string;
  includeCategory?: boolean;
  includeServices?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: CustomerImageUsageType[];
  page?: number;
  limit?: number;
};

export type CustomerSubcategoryDetailQuery = {
  city: string;
  includeCategory?: boolean;
  includeServices?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: CustomerImageUsageType[];
};

export type CustomerServiceDetailQuery = {
  city: string;
  includeCategory?: boolean;
  includeSubcategory?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: CustomerImageUsageType[];
};
