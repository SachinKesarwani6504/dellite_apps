import { AuthStatus } from '@/types/auth-status';
import { AuthUser, UserRole, WorkerProfilePayload } from '@/types/auth';
import { OnboardingCurrentStep, OnboardingRouteName } from '@/types/onboarding';

export type AuthContextType = {
  user: AuthUser | null;
  status: AuthStatus;
  loading: boolean;
  phone: string;
  onboardingRoute: OnboardingRouteName;
  isAuthenticated: boolean;
  sendOtpCode: (phone: string, role?: UserRole) => Promise<void>;
  verifyOtpCode: (phone: string, otp: string) => Promise<void>;
  resendOtpCode: (phone: string) => Promise<void>;
  completeOnboarding: (payload: WorkerProfilePayload) => Promise<void>;
  completeOnboardingFlow: () => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<AuthStatus>;
  refreshOnboardingRoute: () => Promise<OnboardingRouteName>;
  getOnboardingRedirect: (currentRoute: OnboardingRouteName) => OnboardingRouteName | null;
  markOnboardingStepSeen: (step: OnboardingCurrentStep) => void;
};
