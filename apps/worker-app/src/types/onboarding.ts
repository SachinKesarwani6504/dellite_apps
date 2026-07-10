import { AuthStatus } from '@/types/auth-status';
import { OnboardingStackParamList } from '@/types/navigation';

export type OnboardingRouteName = keyof OnboardingStackParamList;

export type WorkerOnboardingSessionState = {
  hasPhoneVerified: boolean;
  hasCompletedBasicProfile: boolean;
  hasSeenSkillSetup: boolean;
  hasSeenCertificateSetup: boolean;
  hasSeenOnboardingWelcomeScreen: boolean;
};

export type WorkerOnboardingResolution = {
  route: OnboardingRouteName;
  status: AuthStatus;
};

export type OnboardingCurrentStep =
  | 'BASIC_PROFILE'
  | 'AADHAAR_VERIFICATION'
  | 'SERVICE_SELECTION'
  | 'CERTIFICATE_UPLOAD'
  | 'WELCOME'
  | string;

export type SelectedCertificateFile = {
  fileId?: string;
  name: string;
  type: string;
  url: string;
};
