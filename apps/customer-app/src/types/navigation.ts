import { AUTH_SCREEN, MAIN_TAB_SCREEN, ONBOARDING_SCREEN, PROFILE_SCREEN, ROOT_SCREEN } from '@/utils/screenNames';

export type RootStackParamList = {
  [ROOT_SCREEN.AUTH_NAVIGATOR]: undefined;
  [ROOT_SCREEN.ONBOARDING_NAVIGATOR]: undefined;
  [ROOT_SCREEN.MAIN_TABS_NAVIGATOR]: undefined;
};

export type AuthStackParamList = {
  [AUTH_SCREEN.PHONE_LOGIN]: undefined;
  [AUTH_SCREEN.OTP_VERIFICATION]: {
    phone: string;
  };
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

export type ProfileStackParamList = {
  [PROFILE_SCREEN.PROFILE_HOME]: undefined;
  [PROFILE_SCREEN.EDIT_PROFILE]: undefined;
};
