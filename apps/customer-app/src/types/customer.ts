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
};

export type CustomerHomeAsset = {
  id?: string;
  filename?: string;
  filepath?: string;
  url?: string;
  fileType?: string;
  usageType?: 'MAIN' | 'ICON' | string;
};

export type CustomerImageCarrier = {
  images?: CustomerHomeAsset[];
  mainImage?: CustomerHomeAsset;
  iconImage?: CustomerHomeAsset;
};

export type CustomerCatalogService = {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  isCertificateRequired?: boolean;
} & CustomerImageCarrier;

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
  mainImage?: CustomerHomeAsset;
  category?: CustomerHomeCategory;
  subCategory?: {
    id?: string;
    name?: string;
    description?: string;
    iconText?: string;
  };
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
  activeStatusValue?: string;
};

export type CustomerHomePayload = {
  header?: CustomerHomeHeader;
  popularServices?: CustomerHomeService[];
  allServices?: CustomerHomeCategory[];
  whyDellite?: string[];
  footer?: CustomerHomeFooter;
};

export type CustomerCatalogQuery = {
  city: string;
  includeSubcategory?: boolean;
  includeServices?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: Array<'MAIN' | 'ICON' | string>;
};
