export const ROOT_SCREEN = {
  AUTH_NAVIGATOR: 'AuthNavigator',
  ONBOARDING_NAVIGATOR: 'OnboardingNavigator',
  MAIN_TABS_NAVIGATOR: 'MainTabsNavigator',
} as const;

export const AUTH_SCREEN = {
  PHONE_LOGIN: 'PhoneLogin',
  OTP_VERIFICATION: 'OtpVerification',
} as const;

export const ONBOARDING_SCREEN = {
  CUSTOMER_IDENTITY: 'OnboardingCustomerIdentity',
  CUSTOMER_WELCOME: 'OnboardingCustomerWelcome',
} as const;

export const MAIN_TAB_SCREEN = {
  HOME: 'Home',
  ONGOING: 'Ongoing',
  BOOKINGS: 'Bookings',
  PROFILE: 'Profile',
} as const;

export const PROFILE_SCREEN = {
  PROFILE_HOME: 'ProfileHome',
  EDIT_PROFILE: 'EditProfile',
} as const;
