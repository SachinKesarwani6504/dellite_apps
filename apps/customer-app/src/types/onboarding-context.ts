import type { OnboardingCurrentStep, OnboardingRouteName } from '@/types/onboarding';

export type OnboardingContextType = {
  onboardingRoute: OnboardingRouteName;
  isOnboardingActive: boolean;
  loading: boolean;
  refreshOnboardingRoute: () => Promise<OnboardingRouteName>;
  getOnboardingRedirect: (currentRoute: OnboardingRouteName) => OnboardingRouteName | null;
  markOnboardingStepSeen: (step: OnboardingCurrentStep) => void;
  completeOnboardingFlow: () => Promise<void>;
};
