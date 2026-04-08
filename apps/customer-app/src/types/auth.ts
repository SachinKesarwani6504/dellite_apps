export const AUTH_STATUS = {
  BOOTSTRAPPING: 'bootstrapping',
  LOGGED_OUT: 'logged_out',
  ONBOARDING: 'onboarding',
  POST_ONBOARDING_WELCOME: 'post_onboarding_welcome',
  AUTHENTICATED: 'authenticated',
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string | null;
};

export type OnboardingFlags = {
  identityCompleted?: boolean;
  profileCompleted?: boolean;
  isBasicInfoCompleted?: boolean;
  hasSeenOnboardingWelcomeScreen?: boolean;
  completed?: boolean;
  isCompleted?: boolean;
};

export type AuthUser = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  createdAt?: string;
  created_at?: string;
  onboarding?: OnboardingFlags & {
    completed?: boolean;
    isCompleted?: boolean;
    hasSeenOnboardingWelcomeScreen?: boolean;
  };
  hasSeenOnboardingWelcomeScreen?: boolean;
  isOnboardingDone?: boolean;
  isOnboardingCompleted?: boolean;
};

export type AuthMeOnboarding = {
  role?: 'CUSTOMER' | 'WORKER' | 'ADMIN' | string;
  isBasicInfoCompleted?: boolean;
  hasSeenOnboardingWelcomeScreen?: boolean;
  completed?: boolean;
  isCompleted?: boolean;
};

export type RequestOtpPayload = {
  phone: string;
  role?: 'CUSTOMER' | 'WORKER' | 'ADMIN';
};

export type VerifyOtpPayload = {
  phone: string;
  otp: string;
};

export type RequestOtpResponse = {
  otpSent: boolean;
  otp?: string;
};

export type VerifyOtpResponse =
  | {
      tokens: AuthTokens;
      accessToken?: never;
      refreshToken?: never;
      phoneToken?: never;
    }
  | {
      tokens?: never;
      accessToken: string;
      refreshToken?: string | null;
      phoneToken?: never;
    }
  | {
      tokens?: never;
      phoneToken: string;
    };

export type ResendOtpResponse = {
  otpSent: boolean;
  otp?: string;
};

export type RefreshTokensPayload = {
  refreshToken: string;
};

export type RefreshTokensResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LogoutPayload = {
  refreshToken: string;
};

export type LogoutResponse = {
  loggedOut: boolean;
};

export type AuthMeResponse = {
  user: AuthUser;
  onboarding?: AuthMeOnboarding;
};

export type AuthState = {
  status: AuthStatus;
  tokens: AuthTokens | null;
  phoneToken: string | null;
  user: AuthUser | null;
};
