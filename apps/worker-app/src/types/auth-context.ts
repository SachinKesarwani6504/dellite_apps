import { AuthStatus } from '@/types/auth-status';
import { AuthMeResponse, AuthUser, UserRole, WorkerProfilePayload } from '@/types/auth';

export type AuthContextType = {
  user: AuthUser | null;
  me: AuthMeResponse | null;
  status: AuthStatus;
  loading: boolean;
  phone: string;
  isAuthenticated: boolean;
  sendOtpCode: (phone: string, role?: UserRole) => Promise<void>;
  verifyOtpCode: (phone: string, otp: string) => Promise<void>;
  resendOtpCode: (phone: string) => Promise<void>;
  completeOnboarding: (payload: WorkerProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<AuthMeResponse>;
};
