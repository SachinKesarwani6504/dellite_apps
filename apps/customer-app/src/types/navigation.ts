import { AUTH_SCREEN, HOME_SCREEN, MAIN_TAB_SCREEN, ONBOARDING_SCREEN, PROFILE_SCREEN, ROOT_SCREEN } from '@/types/screen-names';

export type RootStackParamList = {
  [ROOT_SCREEN.AUTH_NAVIGATOR]: undefined;
  [ROOT_SCREEN.ONBOARDING_NAVIGATOR]: undefined;
  [ROOT_SCREEN.MAIN_TABS_NAVIGATOR]: undefined;
};

export type AuthStackParamList = {
  [AUTH_SCREEN.PHONE_LOGIN]: undefined;
  [AUTH_SCREEN.OTP_VERIFICATION]: undefined;
};

export type OnboardingStackParamList = {
  [ONBOARDING_SCREEN.CUSTOMER_IDENTITY]: undefined;
  [ONBOARDING_SCREEN.CUSTOMER_WELCOME]: undefined;
};

export type MainTabsParamList = {
  [MAIN_TAB_SCREEN.HOME]: undefined;
  [MAIN_TAB_SCREEN.ONGOING]: undefined;
  [MAIN_TAB_SCREEN.BOOKINGS]: undefined;
  [MAIN_TAB_SCREEN.PROFILE]: undefined;
};

export type HomeRouteSourceType = 'popular_service' | 'category';

export type HomeStackParamList = {
  [HOME_SCREEN.HOME]: undefined;
  [HOME_SCREEN.CATEGORY_SUBCATEGORIES]: {
    sourceType: HomeRouteSourceType;
    categoryId: string;
  };
  [HOME_SCREEN.SUBCATEGORY_SERVICES]: {
    sourceType: HomeRouteSourceType;
    categoryId?: string;
    subcategoryId?: string;
    serviceId?: string;
  };
  [HOME_SCREEN.BOOKING_DETAILS]: undefined;
  [HOME_SCREEN.BOOKING_CONFIRMATION]: undefined;
};

export type ProfileStackParamList = {
  [PROFILE_SCREEN.PROFILE_HOME]: undefined;
  [PROFILE_SCREEN.EDIT_PROFILE]: undefined;
  [PROFILE_SCREEN.REFERRAL]: undefined;
};

