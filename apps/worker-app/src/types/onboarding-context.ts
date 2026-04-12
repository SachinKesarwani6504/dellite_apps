import { OnboardingCurrentStep, OnboardingRouteName } from '@/types/onboarding';
import { WorkerCertificateCard, WorkerCertificateCreatePayload, WorkerProfilePayload } from '@/types/auth';

export type OnboardingContextType = {
  onboardingRoute: OnboardingRouteName;
  isOnboardingActive: boolean;
  loading: boolean;
  completeIdentityProfile: (payload: WorkerProfilePayload) => Promise<void>;
  refreshOnboardingRoute: (forceServer?: boolean) => Promise<OnboardingRouteName>;
  getOnboardingRedirect: (currentRoute: OnboardingRouteName) => OnboardingRouteName | null;
  markOnboardingStepSeen: (step: OnboardingCurrentStep) => void;
  completeOnboardingFlow: () => void;
  getRequiredCertificates: () => Promise<WorkerCertificateCard[]>;
  completeCertificateUpload: (payload: WorkerCertificateCreatePayload) => Promise<void>;
  skipCertificateUpload: () => Promise<void>;
};
