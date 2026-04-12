import type { AuthState, AuthStatus } from '@/types/auth';
import type { UpdateCustomerIdentityPayload } from '@/types/customer';

export type AuthContextType = {
  authState: AuthState;
  loading: boolean;
  sendOtpCode: (phone: string) => Promise<void>;
  refreshMe: () => Promise<AuthStatus>;
  verifyOtpAndSignIn: (payload: { phone: string; otp: string }) => Promise<void>;
  resendOtpCode: (phone: string) => Promise<void>;
  completeOnboarding: (payload: UpdateCustomerIdentityPayload) => Promise<void>;
  enterMainTabs: () => Promise<void>;
  completeWelcomeAndEnterMainTabs: () => Promise<void>;
  logout: () => Promise<void>;
};
