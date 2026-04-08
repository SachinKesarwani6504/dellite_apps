import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { authActions, customerActions } from '@/actions';
import { setAuthToken } from '@/actions/http/httpClient';
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

function normalizeUserFromMeResponse(me: AuthMeResponse): AuthState['user'] {
  const mergedOnboarding = {
    ...(me.user.onboarding ?? {}),
    ...(me.onboarding ?? {}),
  };

  return {
    ...me.user,
    onboarding: mergedOnboarding,
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
      setAuthToken(null);
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
        setAuthToken(tokens.accessToken);
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

      const profile = await customerActions.createCustomerProfile(payload, onboardingToken);
      const tokens = {
        accessToken: normalizeBearerToken(profile.accessToken),
        refreshToken: normalizeBearerToken(profile.refreshToken),
      };

      setAuthToken(tokens.accessToken);
      await saveAuthTokens(tokens);
      await clearOnboardingPhoneToken();
      setAuthState((prev) => ({
        ...prev,
        tokens,
        phoneToken: null,
      }));

      const me = await authActions.getMe();
      const nextUser = normalizeUserFromMeResponse(me);
      const nextStatus = resolveAuthStatus(nextUser);
      setAuthState((prev) => ({
        ...prev,
        user: nextUser,
        status: nextStatus === AUTH_STATUS.AUTHENTICATED
          ? AUTH_STATUS.POST_ONBOARDING_WELCOME
          : nextStatus,
      }));
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
    await customerActions.markOnboardingWelcomeSeen(authState.tokens?.accessToken ?? null);
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
  }, [authState.tokens?.accessToken, refreshMe]);

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

        setAuthToken(tokens.accessToken);
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
