import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuthTokens,
  createProfileWithPhoneToken,
  refreshAuth,
  getAuthTokens,
  getMe,
  logoutCurrentSession,
  resendOtp,
  saveAuthTokens,
  sendOtp,
  verifyOtp,
} from '@/actions';
import { AuthStatus } from '@/types/auth-status';
import {
  APP_AUTH_ROLE,
  AuthMeResponse,
  AuthUser,
  UserRole,
  WorkerOnboardingFlags,
  WorkerProfilePayload,
} from '@/types/auth';
import { AuthContextType } from '@/types/auth-context';
import { ApiError } from '@/types/api';
import { OnboardingCurrentStep, OnboardingRouteName, WorkerOnboardingResolution } from '@/types/onboarding';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
type OnboardingPayload = AuthMeResponse['onboarding'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractWorkerOnboardingFlags(onboarding?: OnboardingPayload): WorkerOnboardingFlags | undefined {
  if (!onboarding || typeof onboarding !== 'object') {
    return undefined;
  }

  const toBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      return undefined;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    return undefined;
  };

  const pickBoolean = (source: Record<string, unknown>, keys: string[]): boolean | undefined => {
    for (let index = 0; index < keys.length; index += 1) {
      const next = toBoolean(source[keys[index]]);
      if (typeof next === 'boolean') {
        return next;
      }
    }
    return undefined;
  };

  const normalizeFlags = (raw: unknown): WorkerOnboardingFlags | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    const source = raw as Record<string, unknown>;
    return {
      hasPhoneVerified: pickBoolean(source, ['hasPhoneVerified']),
      hasCompletedBasicProfile: pickBoolean(source, ['hasCompletedBasicProfile', 'hasBasicInfoCompleted', 'isBasicInfoCompleted']),
      hasAadhaarVerified: pickBoolean(source, ['hasAadhaarVerified']),
      hasAddedServiceSkills: pickBoolean(source, ['hasAddedServiceSkills', 'isServicesSelected']),
      hasUploadedRequiredCertificates: pickBoolean(source, ['hasUploadedRequiredCertificates', 'isDocumentsCompleted']),
      currentStep: typeof source.currentStep === 'string' ? source.currentStep : undefined,
    };
  };

  if ('WORKER' in onboarding && onboarding.WORKER && typeof onboarding.WORKER === 'object') {
    return normalizeFlags(onboarding.WORKER);
  }

  const hasFlatFlags =
    'hasPhoneVerified' in onboarding ||
    'hasCompletedBasicProfile' in onboarding ||
    'hasBasicInfoCompleted' in onboarding ||
    'isBasicInfoCompleted' in onboarding ||
    'hasAadhaarVerified' in onboarding ||
    'hasAddedServiceSkills' in onboarding ||
    'isServicesSelected' in onboarding ||
    'hasUploadedRequiredCertificates' in onboarding ||
    'isDocumentsCompleted' in onboarding;

  if (!hasFlatFlags) {
    return undefined;
  }

  return normalizeFlags(onboarding);
}

function mapCurrentStepToRoute(currentStep?: OnboardingCurrentStep): OnboardingRouteName | null {
  if (!currentStep) return null;
  const normalized = currentStep.trim().toUpperCase();
  if (normalized === 'BASIC_PROFILE') return ONBOARDING_SCREENS.identity;
  if (normalized === 'AADHAAR_VERIFICATION') return ONBOARDING_SCREENS.aadhaar;
  if (normalized === 'SERVICE_SELECTION') return ONBOARDING_SCREENS.serviceSelection;
  if (normalized === 'CERTIFICATE_UPLOAD') return ONBOARDING_SCREENS.certification;
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.BOOTSTRAPPING);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [onboardingRoute, setOnboardingRoute] = useState<OnboardingRouteName>(ONBOARDING_SCREENS.identity);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState<string | null>(null);

  const resolveWorkerOnboarding = useCallback((flags?: WorkerOnboardingFlags): WorkerOnboardingResolution => {
    if (!flags) {
      return { route: ONBOARDING_SCREENS.identity, status: AuthStatus.ONBOARDING };
    }

    const hasPhoneVerified = flags.hasPhoneVerified === true;
    const hasCompletedBasicProfile = flags.hasCompletedBasicProfile === true;
    const hasAadhaarVerified = flags.hasAadhaarVerified === true;
    const hasAddedServiceSkills = flags.hasAddedServiceSkills === true;
    const hasUploadedRequiredCertificates = flags.hasUploadedRequiredCertificates === true;
    const hasAnyFlag =
      typeof flags.hasPhoneVerified === 'boolean'
      || typeof flags.hasCompletedBasicProfile === 'boolean'
      || typeof flags.hasAadhaarVerified === 'boolean'
      || typeof flags.hasAddedServiceSkills === 'boolean'
      || typeof flags.hasUploadedRequiredCertificates === 'boolean';

    if (!hasAnyFlag) {
      const routeFromCurrentStep = mapCurrentStepToRoute(flags.currentStep);
      if (routeFromCurrentStep) {
        return { route: routeFromCurrentStep, status: AuthStatus.ONBOARDING };
      }
      return { route: ONBOARDING_SCREENS.identity, status: AuthStatus.ONBOARDING };
    }

    // Enforce deterministic step-by-step progression based on backend flags.
    if (!hasPhoneVerified || !hasCompletedBasicProfile) {
      return { route: ONBOARDING_SCREENS.identity, status: AuthStatus.ONBOARDING };
    }
    if (!hasAadhaarVerified) {
      return { route: ONBOARDING_SCREENS.aadhaar, status: AuthStatus.ONBOARDING };
    }
    if (!hasAddedServiceSkills) {
      return { route: ONBOARDING_SCREENS.serviceSelection, status: AuthStatus.ONBOARDING };
    }
    if (!hasUploadedRequiredCertificates) {
      return { route: ONBOARDING_SCREENS.certification, status: AuthStatus.ONBOARDING };
    }

    return { route: ONBOARDING_SCREENS.welcome, status: AuthStatus.AUTHENTICATED };
  }, []);

  const applyOnboardingFromWorkerFlags = useCallback((flags?: WorkerOnboardingFlags) => {
    const next = resolveWorkerOnboarding(flags);
    setOnboardingRoute(next.route);
    setStatus(next.status);
    return next;
  }, [resolveWorkerOnboarding]);

  const refreshOnboardingSnapshot = useCallback(async () => {
    const me = (await getMe()) as AuthMeResponse;
    setUser(me.user);
    return applyOnboardingFromWorkerFlags(extractWorkerOnboardingFlags(me.onboarding));
  }, [applyOnboardingFromWorkerFlags]);

  const refreshMe = useCallback(async () => {
    const next = await refreshOnboardingSnapshot();
    return next.status;
  }, [refreshOnboardingSnapshot]);

  const refreshOnboardingRoute = useCallback(async () => {
    const next = await refreshOnboardingSnapshot();
    return next.route;
  }, [refreshOnboardingSnapshot]);

  const getOnboardingRedirect = useCallback((currentRoute: OnboardingRouteName) => {
    if (status !== AuthStatus.ONBOARDING && status !== AuthStatus.PHONE_VERIFIED) {
      return null;
    }
    return onboardingRoute === currentRoute ? null : onboardingRoute;
  }, [onboardingRoute, status]);

  const bootstrap = useCallback(async () => {
    try {
      const tokens = await getAuthTokens();
      if (tokens?.accessToken) {
        try {
          const nextStatus = await refreshMe();
          setStatus(nextStatus);
        } catch {
          if (!tokens.refreshToken) {
            throw new Error('Missing refresh token');
          }
          const refreshed = await refreshAuth(tokens.refreshToken);
          await saveAuthTokens(refreshed);
          const nextStatus = await refreshMe();
          setStatus(nextStatus);
        }
      } else {
        setPhoneVerificationToken(null);
        setStatus(AuthStatus.LOGGED_OUT);
      }
    } catch {
      setPhoneVerificationToken(null);
      setStatus(AuthStatus.LOGGED_OUT);
    }
  }, [refreshMe]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const sendOtpCode = useCallback(async (phoneNumber: string, role: UserRole = APP_AUTH_ROLE) => {
    await sendOtp({ phone: phoneNumber, role });
    setPhone(phoneNumber);
  }, []);

  const verifyOtpCode = useCallback(
    async (phoneNumber: string, otp: string) => {
      const response = await verifyOtp({ phone: phoneNumber, otp });
      setPhone(phoneNumber);

      if (response.accessToken && response.refreshToken) {
        await saveAuthTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        setPhoneVerificationToken(null);
        setStatus(AuthStatus.ONBOARDING);
        try {
          const nextStatus = await refreshMe();
          setStatus(nextStatus);
        } catch {
          setStatus(AuthStatus.ONBOARDING);
        }
        return;
      }

      if (response.phoneToken) {
        setPhoneVerificationToken(response.phoneToken);
        setOnboardingRoute(ONBOARDING_SCREENS.identity);
        setStatus(AuthStatus.PHONE_VERIFIED);
        return;
      }

      throw new Error('Invalid verification response from server.');
    },
    [refreshMe],
  );

  const resendOtpCode = useCallback(async (phoneNumber: string) => {
    await resendOtp(phoneNumber);
  }, []);

  const completeOnboarding = useCallback(
    async (payload: WorkerProfilePayload) => {
      const phoneToken = phoneVerificationToken;
      if (!phoneToken) {
        setStatus(AuthStatus.LOGGED_OUT);
        throw new Error('Phone token missing. Please verify OTP again.');
      }

      let response: {
        accessToken?: string;
        refreshToken?: string;
        tokens?: { accessToken?: string; refreshToken?: string };
      };

      try {
        response = (await createProfileWithPhoneToken(payload, phoneToken)) as {
          accessToken?: string;
          refreshToken?: string;
          tokens?: { accessToken?: string; refreshToken?: string };
        };
      } catch (error) {
        if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
          setPhoneVerificationToken(null);
          setStatus(AuthStatus.LOGGED_OUT);
        }
        throw error;
      }

      const accessToken = response.accessToken ?? response.tokens?.accessToken;
      const refreshToken = response.refreshToken ?? response.tokens?.refreshToken;

      if (!accessToken || !refreshToken) {
        throw new Error('Profile created, but auth tokens are missing.');
      }

      await saveAuthTokens({ accessToken, refreshToken });
      setPhoneVerificationToken(null);
      setStatus(AuthStatus.ONBOARDING);
      try {
        const nextStatus = await refreshMe();
        setStatus(nextStatus);
      } catch {
        setStatus(AuthStatus.ONBOARDING);
      }
    },
    [phoneVerificationToken, refreshMe],
  );

  const completeOnboardingFlow = useCallback(() => {
    setStatus(AuthStatus.AUTHENTICATED);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const tokens = await getAuthTokens();
      if (tokens?.refreshToken) {
        await logoutCurrentSession(tokens.refreshToken);
      }
    } catch {
      // Even if API logout fails, we clear local session for safety.
    } finally {
      await clearAuthTokens();
      setPhoneVerificationToken(null);
      setUser(null);
      setPhone('');
      setStatus(AuthStatus.LOGGED_OUT);
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      status,
      loading,
      phone,
      onboardingRoute,
      isAuthenticated: status === AuthStatus.AUTHENTICATED,
      sendOtpCode: async (phoneNumber, role) => {
        setLoading(true);
        try {
          await sendOtpCode(phoneNumber, role);
        } finally {
          setLoading(false);
        }
      },
      verifyOtpCode: async (phoneNumber, otp) => {
        setLoading(true);
        try {
          await verifyOtpCode(phoneNumber, otp);
        } finally {
          setLoading(false);
        }
      },
      resendOtpCode: async phoneNumber => {
        setLoading(true);
        try {
          await resendOtpCode(phoneNumber);
        } finally {
          setLoading(false);
        }
      },
      completeOnboarding: async payload => {
        setLoading(true);
        try {
          await completeOnboarding(payload);
        } finally {
          setLoading(false);
        }
      },
      completeOnboardingFlow,
      logout,
      refreshMe,
      refreshOnboardingRoute,
      getOnboardingRedirect,
    }),
    [
      user,
      status,
      loading,
      phone,
      onboardingRoute,
      sendOtpCode,
      verifyOtpCode,
      resendOtpCode,
      completeOnboarding,
      completeOnboardingFlow,
      logout,
      refreshMe,
      refreshOnboardingRoute,
      getOnboardingRedirect,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
