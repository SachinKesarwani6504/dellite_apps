import { AuthStatus } from '@/types/auth-status';
import { AuthMeResponse, AuthUser, UserRole, WorkerOnboardingPrefillData, WorkerProfilePayload } from '@/types/auth';
import type { LocationContextValue } from '@/modules/location/types/location.types';

export type AuthContextType = {
  user: AuthUser | null;
  me: AuthMeResponse | null;
  onboardingPrefill: WorkerOnboardingPrefillData | null;
  status: AuthStatus;
  loading: boolean;
  bootstrappingLoading: boolean;
  phone: string;
  isAuthenticated: boolean;
  locationState: LocationContextValue;
  sendOtpCode: (phone: string, role?: UserRole) => Promise<void>;
  verifyOtpCode: (phone: string, otp: string) => Promise<void>;
  resendOtpCode: (phone: string) => Promise<void>;
  completeOnboarding: (payload: WorkerProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<AuthMeResponse>;
  fetchOnboardingPrefill: (phoneToken: string) => Promise<WorkerOnboardingPrefillData | null>;
};
