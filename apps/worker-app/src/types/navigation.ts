import { AUTH_SCREENS, JOB_STACK_SCREENS, MAIN_TAB_SCREENS, ONBOARDING_SCREENS, PROFILE_SCREENS } from '@/types/screen-names';

export type AuthStackParamList = {
  [AUTH_SCREENS.phoneLogin]: undefined;
  [AUTH_SCREENS.otpVerification]: undefined;
};

export type OnboardingStackParamList = {
  [ONBOARDING_SCREENS.identity]: undefined;
  [ONBOARDING_SCREENS.serviceSelection]: undefined;
  [ONBOARDING_SCREENS.certification]: undefined;
  [ONBOARDING_SCREENS.welcomeWorker]: undefined;
};

export type ProfileStackParamList = {
  [PROFILE_SCREENS.home]: undefined;
  [PROFILE_SCREENS.editProfile]: undefined;
  [PROFILE_SCREENS.payoutDetails]: undefined;
  [PROFILE_SCREENS.helpSupport]: undefined;
  [PROFILE_SCREENS.identityVerification]: undefined;
  [PROFILE_SCREENS.referral]: undefined;
  [PROFILE_SCREENS.allSkills]: undefined;
  [PROFILE_SCREENS.certificateManager]: undefined;
  [PROFILE_SCREENS.skillManager]: undefined;
};

export type MainTabParamList = {
  [MAIN_TAB_SCREENS.home]: undefined;
  [MAIN_TAB_SCREENS.jobs]: undefined;
  [MAIN_TAB_SCREENS.earnings]: undefined;
  [MAIN_TAB_SCREENS.profile]: undefined;
};

export type JobStackParamList = {
  [JOB_STACK_SCREENS.home]: undefined;
  [JOB_STACK_SCREENS.details]: { jobId: string };
};
