import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { authActions, customerActions } from '@/actions';
import { AUTH_STATUS, type AuthMeResponse, type AuthState, type AuthStatus, type AuthTokens } from '@/types/auth';
import type { AuthContextType } from '@/types/auth-context';
import type { UpdateCustomerIdentityPayload } from '@/types/customer';
import {
  clearAuthTokens,
  clearOnboardingPhoneToken,
  getAuthTokens,
  getOnboardingPhoneToken,
  saveAuthTokens,
  saveOnboardingPhoneToken,
} from '@/utils/key-chain-storage';

const defaultState: AuthState = {
  status: AUTH_STATUS.BOOTSTRAPPING,
  tokens: null,
  phoneToken: null,
  user: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function extractBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function extractCustomerOnboardingFlags(source: unknown) {
  if (!isRecord(source)) {
    return {};
  }

  const direct = source;
  const nestedCustomer = isRecord(source.CUSTOMER) ? source.CUSTOMER : {};

  const isBasicInfoCompleted =
    extractBoolean(direct.isBasicInfoCompleted)
    ?? extractBoolean(nestedCustomer.isBasicInfoCompleted);
  const hasSeenOnboardingWelcomeScreen =
    extractBoolean(direct.hasSeenOnboardingWelcomeScreen)
    ?? extractBoolean(nestedCustomer.hasSeenOnboardingWelcomeScreen);
  const completed =
    extractBoolean(direct.completed)
    ?? extractBoolean(nestedCustomer.completed);
  const isCompleted =
    extractBoolean(direct.isCompleted)
    ?? extractBoolean(nestedCustomer.isCompleted);

  return {
    isBasicInfoCompleted,
    hasSeenOnboardingWelcomeScreen,
    completed,
    isCompleted,
  };
}

function normalizeBearerToken(token: string | null | undefined) {
  if (!token) {
    return '';
  }

  return token.replace(/^Bearer\s+/i, '').trim();
}

function extractTokensFromVerifyOtpResponse(
  response: Awaited<ReturnType<typeof authActions.verifyOtp>>,
): AuthTokens | null {
  if (response.tokens?.accessToken) {
    return {
      accessToken: normalizeBearerToken(response.tokens.accessToken),
      refreshToken: normalizeBearerToken(response.tokens.refreshToken ?? null),
    };
  }

  if ('accessToken' in response && typeof response.accessToken === 'string') {
    return {
      accessToken: normalizeBearerToken(response.accessToken),
      refreshToken: normalizeBearerToken(response.refreshToken ?? null),
    };
  }

  return null;
}

function extractPhoneTokenFromVerifyOtpResponse(
  response: Awaited<ReturnType<typeof authActions.verifyOtp>>,
): string | null {
  if ('phoneToken' in response && typeof response.phoneToken === 'string') {
    return response.phoneToken;
  }
  return null;
}

function normalizeUserFromMeResponse(me: AuthMeResponse): NonNullable<AuthState['user']> {
  const normalizedOnboardingFromRoot = extractCustomerOnboardingFlags(me.onboarding);
  const mergedOnboarding = {
    ...(me.user.onboarding ?? {}),
    ...normalizedOnboardingFromRoot,
  };

  const resolvedReferralCode = (() => {
    if (typeof me.user.referralCode === 'string' && me.user.referralCode.trim()) {
      return me.user.referralCode;
    }
    if (typeof me.referral?.code === 'string' && me.referral.code.trim()) {
      return me.referral.code;
    }
    return undefined;
  })();

  const roleLinkHasSeenWelcome = isRecord(me.roleLink)
    ? extractBoolean(me.roleLink.hasSeenOnboardingWelcomeScreen)
    : undefined;

  return {
    ...me.user,
    referral: me.user.referral ?? me.referral,
    roles: me.user.roles ?? me.roles,
    referralCode: resolvedReferralCode,
    onboarding: mergedOnboarding,
    hasSeenOnboardingWelcomeScreen:
      (typeof me.user.hasSeenOnboardingWelcomeScreen === 'boolean'
        ? me.user.hasSeenOnboardingWelcomeScreen
        : undefined)
      ?? mergedOnboarding.hasSeenOnboardingWelcomeScreen
      ?? roleLinkHasSeenWelcome,
  };
}

function isOnboardingComplete(user: AuthState['user']) {
  if (!user || typeof user !== 'object') {
    return false;
  }

  if (typeof user.isOnboardingDone === 'boolean') {
    return user.isOnboardingDone;
  }

  if (typeof user.isOnboardingCompleted === 'boolean') {
    return user.isOnboardingCompleted;
  }

  const onboarding = user.onboarding;
  if (!onboarding || typeof onboarding !== 'object') {
    return false;
  }

  if (typeof onboarding.completed === 'boolean') {
    return onboarding.completed;
  }

  if (typeof onboarding.isCompleted === 'boolean') {
    return onboarding.isCompleted;
  }

  if (typeof onboarding.isBasicInfoCompleted === 'boolean') {
    return onboarding.isBasicInfoCompleted;
  }

  if (
    typeof onboarding.identityCompleted === 'boolean' &&
    typeof onboarding.profileCompleted === 'boolean'
  ) {
    return onboarding.identityCompleted && onboarding.profileCompleted;
  }

  return false;
}

function resolveAuthStatus(user: AuthState['user']): AuthStatus {
  if (!user) {
    return AUTH_STATUS.LOGGED_OUT;
  }

  if (!isOnboardingComplete(user)) {
    return AUTH_STATUS.ONBOARDING;
  }

  const hasSeenWelcome =
    (typeof user.hasSeenOnboardingWelcomeScreen === 'boolean'
      ? user.hasSeenOnboardingWelcomeScreen
      : undefined) ??
    (typeof user.onboarding?.hasSeenOnboardingWelcomeScreen === 'boolean'
      ? user.onboarding.hasSeenOnboardingWelcomeScreen
      : undefined);

  if (hasSeenWelcome === false) {
    return AUTH_STATUS.POST_ONBOARDING_WELCOME;
  }

  return AUTH_STATUS.AUTHENTICATED;
}

export function useAuthController(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>(defaultState);
  const [pendingActionCount, setPendingActionCount] = useState(0);
  const inFlightRefreshMeRef = useRef<Promise<AuthStatus> | null>(null);
  const loading = pendingActionCount > 0;

  const runWithActionState = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setPendingActionCount((count) => count + 1);
    try {
      return await operation();
    } finally {
      setPendingActionCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const refreshMe = useCallback(async (): Promise<AuthStatus> => {
    if (!inFlightRefreshMeRef.current) {
      inFlightRefreshMeRef.current = (async () => {
        const me = await authActions.getMe();
        const nextUser = normalizeUserFromMeResponse(me);
        const status = resolveAuthStatus(nextUser);
        setAuthState((prev) => ({
          ...prev,
          user: nextUser,
          status,
        }));
        return status;
      })().finally(() => {
        inFlightRefreshMeRef.current = null;
      }) as Promise<AuthStatus>;
    }

    return inFlightRefreshMeRef.current;
  }, []);

  const logout = useCallback(async () => {
    try {
      const tokens = await getAuthTokens();
      if (tokens?.refreshToken) {
        try {
          await authActions.logout({ refreshToken: tokens.refreshToken });
        } catch {
          // Ignore logout API failures; local logout should still succeed.
        }
      }
    } finally {
      await clearAuthTokens();
      await clearOnboardingPhoneToken();
      setAuthState({
        status: AUTH_STATUS.LOGGED_OUT,
        tokens: null,
        phoneToken: null,
        user: null,
      });
    }
  }, []);

  const verifyOtpAndSignIn = useCallback(
    async (payload: { phone: string; otp: string }) => {
      const response = await authActions.verifyOtp(payload);
      const tokens = extractTokensFromVerifyOtpResponse(response);

      if (tokens?.accessToken) {
        await saveAuthTokens(tokens);
        await clearOnboardingPhoneToken();

        setAuthState((prev) => ({
          ...prev,
          tokens,
          phoneToken: null,
        }));

        await refreshMe();
        return;
      }

      const phoneToken = extractPhoneTokenFromVerifyOtpResponse(response);
      if (!phoneToken) {
        throw new Error('Invalid verification response from server.');
      }

      await saveOnboardingPhoneToken(phoneToken);
      setAuthState((prev) => ({
        ...prev,
        status: AUTH_STATUS.ONBOARDING,
        phoneToken,
        tokens: null,
        user: null,
      }));
    },
    [refreshMe],
  );

  const completeOnboarding = useCallback(
    async (payload: UpdateCustomerIdentityPayload) => {
      const onboardingToken = authState.phoneToken;

      if (!onboardingToken) {
        throw new Error('Your phone verification session expired. Please verify OTP again.');
      }

      const profile = await customerActions.createCustomerProfile(payload);
      const tokens = {
        accessToken: normalizeBearerToken(profile.accessToken),
        refreshToken: normalizeBearerToken(profile.refreshToken),
      };

      await saveAuthTokens(tokens);
      await clearOnboardingPhoneToken();
      setAuthState((prev) => ({
        ...prev,
        tokens,
        phoneToken: null,
        status: AUTH_STATUS.POST_ONBOARDING_WELCOME,
      }));

      try {
        const me = await authActions.getMe();
        const nextUser = normalizeUserFromMeResponse(me);
        const hasSeenWelcome = extractBoolean(nextUser.hasSeenOnboardingWelcomeScreen)
          ?? extractBoolean(nextUser.onboarding?.hasSeenOnboardingWelcomeScreen);
        setAuthState((prev) => ({
          ...prev,
          user: nextUser,
          status: hasSeenWelcome === true
            ? AUTH_STATUS.AUTHENTICATED
            : AUTH_STATUS.POST_ONBOARDING_WELCOME,
        }));
      } catch {
        // Keep optimistic onboarding-forward state. A later refresh can reconcile.
      }
    },
    [authState.phoneToken],
  );

  const enterMainTabs = useCallback(async () => {
    setAuthState((prev) => {
      if (prev.status === AUTH_STATUS.LOGGED_OUT) {
        return prev;
      }
      return {
        ...prev,
        status: AUTH_STATUS.AUTHENTICATED,
      };
    });
  }, []);

  const completeWelcomeAndEnterMainTabs = useCallback(async () => {
    await customerActions.markOnboardingWelcomeSeen();
    const status = await refreshMe();

    if (status === AUTH_STATUS.POST_ONBOARDING_WELCOME) {
      setAuthState((prev) => {
        if (!prev.user) {
          return {
            ...prev,
            status: AUTH_STATUS.AUTHENTICATED,
          };
        }

        return {
          ...prev,
          status: AUTH_STATUS.AUTHENTICATED,
          user: {
            ...prev.user,
            hasSeenOnboardingWelcomeScreen: true,
            onboarding: {
              ...(prev.user.onboarding ?? {}),
              hasSeenOnboardingWelcomeScreen: true,
            },
          },
        };
      });
    }
  }, [refreshMe]);

  const refreshMeWithState = useCallback(() => runWithActionState(refreshMe), [runWithActionState, refreshMe]);
  const verifyOtpAndSignInWithState = useCallback(
    (payload: { phone: string; otp: string }) => runWithActionState(() => verifyOtpAndSignIn(payload)),
    [runWithActionState, verifyOtpAndSignIn],
  );
  const completeOnboardingWithState = useCallback(
    (payload: UpdateCustomerIdentityPayload) => runWithActionState(() => completeOnboarding(payload)),
    [runWithActionState, completeOnboarding],
  );
  const enterMainTabsWithState = useCallback(() => runWithActionState(enterMainTabs), [runWithActionState, enterMainTabs]);
  const completeWelcomeAndEnterMainTabsWithState = useCallback(
    () => runWithActionState(completeWelcomeAndEnterMainTabs),
    [runWithActionState, completeWelcomeAndEnterMainTabs],
  );
  const logoutWithState = useCallback(() => runWithActionState(logout), [runWithActionState, logout]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const [tokens, pendingPhoneToken] = await Promise.all([
          getAuthTokens(),
          getOnboardingPhoneToken(),
        ]);

        if (!mounted) {
          return;
        }

        if (!tokens?.accessToken) {
          if (pendingPhoneToken) {
            setAuthState({
              status: AUTH_STATUS.ONBOARDING,
              tokens: null,
              phoneToken: pendingPhoneToken,
              user: null,
            });
            return;
          }

          setAuthState({
            status: AUTH_STATUS.LOGGED_OUT,
            tokens: null,
            phoneToken: null,
            user: null,
          });
          return;
        }

        setAuthState((prev) => ({
          ...prev,
          tokens,
          status: AUTH_STATUS.BOOTSTRAPPING,
        }));

        try {
          const me = await authActions.getMe();
          const nextUser = normalizeUserFromMeResponse(me);
          if (!mounted) {
            return;
          }

          setAuthState({
            status: resolveAuthStatus(nextUser),
            tokens,
            phoneToken: null,
            user: nextUser,
          });
          await clearOnboardingPhoneToken();
        } catch {
          await logout();
        }
      } catch {
        if (mounted) {
          setAuthState({
            status: AUTH_STATUS.LOGGED_OUT,
            tokens: null,
            phoneToken: null,
            user: null,
          });
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [logout]);

  return useMemo<AuthContextType>(
    () => ({
      authState,
      loading,
      refreshMe: refreshMeWithState,
      verifyOtpAndSignIn: verifyOtpAndSignInWithState,
      completeOnboarding: completeOnboardingWithState,
      enterMainTabs: enterMainTabsWithState,
      completeWelcomeAndEnterMainTabs: completeWelcomeAndEnterMainTabsWithState,
      logout: logoutWithState,
    }),
    [
      authState,
      loading,
      refreshMeWithState,
      verifyOtpAndSignInWithState,
      completeOnboardingWithState,
      enterMainTabsWithState,
      completeWelcomeAndEnterMainTabsWithState,
      logoutWithState,
    ],
  );
}
