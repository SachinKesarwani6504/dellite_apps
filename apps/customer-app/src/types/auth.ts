export const AUTH_STATUS = {
  BOOTSTRAPPING: 'bootstrapping',
  LOGGED_OUT: 'logged_out',
  OTP_SENT: 'otp_sent',
  ONBOARDING: 'onboarding',
  POST_ONBOARDING_WELCOME: 'post_onboarding_welcome',
  AUTHENTICATED: 'authenticated',
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';
export const REFERRAL_ROLES = {
  CUSTOMER: 'CUSTOMER',
  WORKER: 'WORKER',
} as const;
export type ReferralRole = (typeof REFERRAL_ROLES)[keyof typeof REFERRAL_ROLES];

export type ReferralReward = {
  rewardType?: string;
  value?: string;
  unit?: string;
};

export type ReferralMatrixEntry = {
  key?: 'CC' | 'CW' | 'WC' | 'WW' | string;
  triggerEvent?: string;
  referrerTriggerEvent?: string;
  referredTriggerEvent?: string;
  referrerRole?: UserRole | string;
  referredRole?: UserRole | string;
  referrerReward?: ReferralReward;
  referredReward?: ReferralReward;
};

export type ReferralRewardSet = {
  whenReferredRoleIsCUSTOMER?: ReferralReward;
  whenReferredRoleIsWORKER?: ReferralReward;
};

export type ReferralInfo = {
  code?: string;
  triggerEvent?: string;
  supportedTriggerEvents?: string[];
  coinConversion?: {
    oneCoinEqualsRupees?: string;
    currency?: string;
  };
  signupRewardMatrix?: Record<'CC' | 'CW' | 'WC' | 'WW', ReferralMatrixEntry> & Record<string, ReferralMatrixEntry | undefined>;
  availableReferrerRoles?: Array<UserRole | string>;
  selectedRole?: UserRole | string;
  selectedRoleRewards?: ReferralRewardSet;
  rewardResolutionRule?: string;
  rewardsByReferralRole?: {
    CUSTOMER?: ReferralRewardSet;
    WORKER?: ReferralRewardSet;
    [key: string]: ReferralRewardSet | undefined;
  };
  bothRolesRule?: string;
};

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
  referralCode?: string;
  referral?: ReferralInfo;
  roles?: Record<UserRole, boolean> & Record<string, boolean>;
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
  role?: UserRole | string;
  isBasicInfoCompleted?: boolean;
  hasSeenOnboardingWelcomeScreen?: boolean;
  completed?: boolean;
  isCompleted?: boolean;
};

export type RequestOtpPayload = {
  phone: string;
  role?: UserRole;
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
  referral?: ReferralInfo;
  roleLink?: {
    id?: string;
    hasSeenOnboardingWelcomeScreen?: boolean;
    [key: string]: unknown;
  };
  roles?: Record<UserRole, boolean> & Record<string, boolean>;
  onboarding?: AuthMeOnboarding;
};

export type AuthState = {
  status: AuthStatus;
  tokens: AuthTokens | null;
  phoneToken: string | null;
  phone: string;
  user: AuthUser | null;
};
