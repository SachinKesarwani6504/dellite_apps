import { AUTH_SCREENS, EARNINGS_STACK_SCREENS, JOB_STACK_SCREENS, MAIN_TAB_SCREENS, ONBOARDING_SCREENS, PROFILE_SCREENS, ROOT_SCREENS } from '@/types/screen-names';
import type { WorkerJobInviteStatus } from '@/types/jobs';
import type { WorkerJobListTab, WorkerJobsListMode } from '@/types/jobs';

export type RootStackParamList = {
  [ROOT_SCREENS.authNavigator]: undefined;
  [ROOT_SCREENS.onboardingNavigator]: undefined;
  [ROOT_SCREENS.mainTabsNavigator]: undefined;
  [ROOT_SCREENS.jobsNavigator]: {
    screen?: typeof JOB_STACK_SCREENS.home | typeof JOB_STACK_SCREENS.availableJobs;
    params?: JobStackParamList[typeof JOB_STACK_SCREENS.home]
      | JobStackParamList[typeof JOB_STACK_SCREENS.availableJobs];
  } | undefined;
  [ROOT_SCREENS.jobDetailsNavigator]: {
    screen: string;
    params?: unknown;
  };
  [ROOT_SCREENS.profileDetailsNavigator]: {
    screen: string;
    params?: unknown;
  };
};

export type PendingNavigation = {
  type?: 'navigate';
  routeName: string;
  params?: unknown;
} | {
  type: 'protectedRoot';
  mainRouteName: string;
  routeName: string;
  params?: unknown;
};

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
  [PROFILE_SCREENS.notifications]: undefined;
  [PROFILE_SCREENS.settings]: undefined;
  [PROFILE_SCREENS.identityVerification]: undefined;
  [PROFILE_SCREENS.referral]: undefined;
  [PROFILE_SCREENS.allJobs]: { listMode?: 'ALL' } | undefined;
  [PROFILE_SCREENS.allSkills]: undefined;
  [PROFILE_SCREENS.certificateManager]: undefined;
  [PROFILE_SCREENS.skillManager]: undefined;
};

export type MainTabParamList = {
  [MAIN_TAB_SCREENS.home]: undefined;
  [MAIN_TAB_SCREENS.earnings]: {
    screen?: typeof EARNINGS_STACK_SCREENS.home | typeof EARNINGS_STACK_SCREENS.settlementDetail;
    params?: EarningsStackParamList[typeof EARNINGS_STACK_SCREENS.settlementDetail];
  } | undefined;
  [MAIN_TAB_SCREENS.profile]: undefined;
};

export type EarningsStackParamList = {
  [EARNINGS_STACK_SCREENS.home]: undefined;
  [EARNINGS_STACK_SCREENS.settlementDetail]: {
    settlementId: string;
  };
};

export type JobStackParamList = {
  [JOB_STACK_SCREENS.home]: { initialTab?: WorkerJobListTab; initialTabRequestKey?: number; listMode?: WorkerJobsListMode } | undefined;
  [JOB_STACK_SCREENS.availableJobs]: { listMode?: 'NEW_JOBS' } | undefined;
  [JOB_STACK_SCREENS.details]: { jobId: string; inviteStatus?: WorkerJobInviteStatus | null };
};

export type JobsStackParamList = {
  [JOB_STACK_SCREENS.details]: { jobId: string; inviteStatus?: WorkerJobInviteStatus | null };
};
