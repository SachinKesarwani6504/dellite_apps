import { AuthStatus } from '@/types/auth-status';
import { OnboardingStackParamList } from '@/types/navigation';

export type OnboardingRouteName = keyof OnboardingStackParamList;

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
  name: string;
  type: string;
  url: string;
};
