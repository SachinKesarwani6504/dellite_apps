import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { authActions, customerActions } from '@/actions';
import { ApiError } from '@/types/api';
import { AUTH_STATUS, type AuthMeResponse, type AuthState, type AuthStatus, type AuthTokens } from '@/types/auth';
import type { AuthContextType } from '@/types/auth-context';
import type { UpdateCustomerIdentityPayload } from '@/types/customer';
import { useLocationController } from '@/hooks/useLocationController';
import {
  applyFirebaseCustomToken,
  clearFirebaseAuthSession,
} from '@/utils/firebase-session';
import { buildDeviceSessionPayload } from '@/utils/device-session';
import { resolveCustomerBookingCountsFromMeResponse } from '@/utils/customer-booking-counts';
import {
  forcedSessionLogoutMessage,
  isForcedSessionLogoutError,
} from '@/utils/session-errors';
import { showError } from '@/utils/toast';
import {
  clearAuthTokens,
  clearOnboardingPhoneToken,
  getAuthTokens,
  getOnboardingPhoneToken,
  saveAuthTokens,
  saveOnboardingPhoneToken,
} from '@/utils/key-chain-storage';
import {
  getNotificationPermissionStatusFromDevice,
  requestNotificationPermissionFromDevice,
  syncPendingPushTokenFromDevice,
} from '@/lib/permission';

const defaultState: AuthState = {
  status: AUTH_STATUS.BOOTSTRAPPING,
  tokens: null,
  phoneToken: null,
  phone: '',
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
    bookingCounts: resolveCustomerBookingCountsFromMeResponse(me),
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
  const locationState = useLocationController();
  const [authState, setAuthState] = useState<AuthState>(defaultState);
  const [pendingActionCount, setPendingActionCount] = useState(0);
  const inFlightRefreshMeRef = useRef<Promise<AuthStatus> | null>(null);
  const inFlightDeviceSessionSyncRef = useRef<Promise<void> | null>(null);
  const lastDeviceSessionPayloadFingerprintRef = useRef<string | null>(null);
  const loading = pendingActionCount > 0;
  const bootstrappingLoading = authState.status === AUTH_STATUS.BOOTSTRAPPING;

  const runWithActionState = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setPendingActionCount((count) => count + 1);
    try {
      return await operation();
    } finally {
      setPendingActionCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const resetInvalidAuthMeSession = useCallback(async () => {
    await clearAuthTokens();
    await clearOnboardingPhoneToken();
    await clearFirebaseAuthSession();
    setAuthState({
      status: AUTH_STATUS.LOGGED_OUT,
      tokens: null,
      phoneToken: null,
      phone: '',
      user: null,
    });
  }, []);

  const shouldResetAfterAuthMeError = useCallback((error: unknown) => {
    return error instanceof ApiError && error.statusCode === 400;
  }, []);

  const refreshMe = useCallback(async (): Promise<AuthStatus> => {
    if (!inFlightRefreshMeRef.current) {
      inFlightRefreshMeRef.current = (async () => {
        try {
          const me = await authActions.getMe();
          const nextUser = normalizeUserFromMeResponse(me);
          const status = resolveAuthStatus(nextUser);
          setAuthState((prev) => ({
            ...prev,
            user: nextUser,
            status,
          }));
          return status;
        } catch (error) {
          if (shouldResetAfterAuthMeError(error)) {
            await resetInvalidAuthMeSession();
            return AUTH_STATUS.LOGGED_OUT;
          }
          throw error;
        }
      })().finally(() => {
        inFlightRefreshMeRef.current = null;
      }) as Promise<AuthStatus>;
    }

    return inFlightRefreshMeRef.current;
  }, [resetInvalidAuthMeSession, shouldResetAfterAuthMeError]);

  const ensureFirebaseSession = useCallback(async (
    _accessToken: string | null,
    firebaseCustomToken?: string | null,
  ) => {
    await applyFirebaseCustomToken(firebaseCustomToken ?? null);
  }, []);

  const handleForcedSessionLogout = useCallback(async () => {
    lastDeviceSessionPayloadFingerprintRef.current = null;
    await clearAuthTokens();
    await clearOnboardingPhoneToken();
    await clearFirebaseAuthSession();
    setAuthState({
      status: AUTH_STATUS.LOGGED_OUT,
      tokens: null,
      phoneToken: null,
      phone: '',
      user: null,
    });
    showError(forcedSessionLogoutMessage);
  }, []);

  const promptNotificationPermissionForDeviceSession = useCallback(async () => {
    const currentStatus = await getNotificationPermissionStatusFromDevice();

    if (currentStatus === 'granted') {
      return currentStatus;
    }

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[customer-auth] device-session-notification-permission-request-start', {
        currentStatus,
      });
    }

    const nextStatus = await requestNotificationPermissionFromDevice();

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[customer-auth] device-session-notification-permission-request-complete', {
        nextStatus,
      });
    }

    return nextStatus;
  }, []);

  const buildProfileDeviceInfoBestEffort = useCallback(async () => {
    try {
      await syncPendingPushTokenFromDevice();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-auth] profile-device-info-push-token-fetch-failed', error);
      }
    }

    try {
      const payload = await buildDeviceSessionPayload('CUSTOMER');
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-auth] profile-device-info-ready', {
          role: payload.role,
          platform: payload.platform,
          hasDeviceId: Boolean(payload.deviceId),
          hasPushToken: Boolean(payload.fcmToken),
        });
      }
      return payload;
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-auth] profile-device-info-build-failed', error);
      }
      return undefined;
    }
  }, []);

  const syncDeviceSessionBestEffort = useCallback(async () => {
    if (inFlightDeviceSessionSyncRef.current) {
      await inFlightDeviceSessionSyncRef.current;
      return;
    }

    const syncTask = (async () => {
      try {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-auth] device-session-sync-start', { mode: 'update' });
      }

      const tokens = await getAuthTokens();
      if (!tokens?.accessToken) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[customer-auth] device-session-skipped-no-access-token', { mode: 'update' });
        }
        return;
      }

      try {
        await syncPendingPushTokenFromDevice();
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[customer-auth] device-session-push-token-fetch-failed', error);
        }
      }

      const payload = await buildDeviceSessionPayload('CUSTOMER');
      const payloadFingerprint = JSON.stringify({
        role: payload.role,
        platform: payload.platform,
        deviceId: payload.deviceId,
        deviceName: payload.deviceName,
        fcmToken: payload.fcmToken,
      });

      if (lastDeviceSessionPayloadFingerprintRef.current === payloadFingerprint) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[customer-auth] device-session-skipped-duplicate-payload', {
            mode: 'update',
            hasPushToken: Boolean(payload.fcmToken),
          });
        }
        return;
      }

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-auth] device-session-upsert-send', {
          mode: 'update',
          role: payload.role,
          platform: payload.platform,
          hasDeviceId: Boolean(payload.deviceId),
          deviceIdLength: payload.deviceId.length,
          deviceName: payload.deviceName,
          hasPushToken: Boolean(payload.fcmToken),
          pushTokenLength: payload.fcmToken?.length ?? 0,
        });
      }

      await authActions.updateDeviceSession(payload);
      lastDeviceSessionPayloadFingerprintRef.current = payloadFingerprint;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-auth] device-session-upsert-success', { mode: 'update' });
      }
    } catch (error) {
      if (isForcedSessionLogoutError(error)) {
        await handleForcedSessionLogout();
        return;
      }
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-auth] device-session-upsert-failed', {
          mode: 'update',
          error,
        });
      }
    }
    })().finally(() => {
      inFlightDeviceSessionSyncRef.current = null;
    });

    inFlightDeviceSessionSyncRef.current = syncTask;
    await syncTask;
  }, [handleForcedSessionLogout]);

  const syncDeviceSessionRegistration = useCallback(async () => {
    await syncDeviceSessionBestEffort();
  }, [syncDeviceSessionBestEffort]);

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
      lastDeviceSessionPayloadFingerprintRef.current = null;
      await clearAuthTokens();
      await clearOnboardingPhoneToken();
      setAuthState({
        status: AUTH_STATUS.LOGGED_OUT,
        tokens: null,
        phoneToken: null,
        phone: '',
        user: null,
      });
    }
  }, []);

  const sendOtpCode = useCallback(async (phone: string) => {
    await clearAuthTokens();
    await clearOnboardingPhoneToken();
    await authActions.sendOtp({ phone, role: 'CUSTOMER' });

    setAuthState((prev) => ({
      ...prev,
      status: AUTH_STATUS.OTP_SENT,
      tokens: null,
      phoneToken: null,
      phone,
      user: null,
    }));
  }, []);

  const verifyOtpAndSignIn = useCallback(
    async (payload: { phone: string; otp: string }) => {
      const response = await authActions.verifyOtp(payload);
      const tokens = extractTokensFromVerifyOtpResponse(response);

      if (tokens?.accessToken) {
        await saveAuthTokens(tokens);
        await ensureFirebaseSession(tokens.accessToken, response.firebaseCustomToken);
        await clearOnboardingPhoneToken();
        await promptNotificationPermissionForDeviceSession();
        void syncDeviceSessionRegistration();

        setAuthState((prev) => ({
          ...prev,
          tokens,
          phoneToken: null,
          phone: payload.phone,
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
        phone: payload.phone,
        user: null,
      }));
    },
    [
      ensureFirebaseSession,
      promptNotificationPermissionForDeviceSession,
      refreshMe,
      syncDeviceSessionRegistration,
    ],
  );

  const completeOnboarding = useCallback(
    async (payload: UpdateCustomerIdentityPayload) => {
      const onboardingToken = authState.phoneToken;

      if (!onboardingToken) {
        throw new Error('Your phone verification session expired. Please verify OTP again.');
      }

      let profile: Awaited<ReturnType<typeof customerActions.createCustomerProfile>>;
      try {
        await promptNotificationPermissionForDeviceSession();
        const deviceInfo = await buildProfileDeviceInfoBestEffort();
        profile = await customerActions.createCustomerProfile({
          ...payload,
          deviceInfo,
        });
      } catch (error) {
        if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
          await clearOnboardingPhoneToken();
          setAuthState((prev) => ({
            ...prev,
            status: AUTH_STATUS.LOGGED_OUT,
            phoneToken: null,
          }));
        }
        throw error;
      }
      const tokens = {
        accessToken: normalizeBearerToken(profile.accessToken),
        refreshToken: normalizeBearerToken(profile.refreshToken),
      };

      await saveAuthTokens(tokens);
      await ensureFirebaseSession(tokens.accessToken, profile.firebaseCustomToken);
      await clearOnboardingPhoneToken();
      setAuthState((prev) => ({
        ...prev,
        tokens,
        phoneToken: null,
        phone: '',
        status: AUTH_STATUS.POST_ONBOARDING_WELCOME,
      }));

      try {
        // Reuse shared refresh pipeline so concurrent onboarding checks
        // join the same in-flight `/auth/me` call.
        await refreshMe();
      } catch {
        // Keep optimistic onboarding-forward state. A later refresh can reconcile.
      }
    },
    [
      authState.phoneToken,
      buildProfileDeviceInfoBestEffort,
      ensureFirebaseSession,
      promptNotificationPermissionForDeviceSession,
      refreshMe,
    ],
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

  const resendOtpCode = useCallback(async (phone: string) => {
    await authActions.resendOtp(phone);
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
  const sendOtpCodeWithState = useCallback(
    (phone: string) => runWithActionState(() => sendOtpCode(phone)),
    [runWithActionState, sendOtpCode],
  );
  const resendOtpCodeWithState = useCallback(
    (phone: string) => runWithActionState(() => resendOtpCode(phone)),
    [runWithActionState, resendOtpCode],
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
              phone: '',
              user: null,
            });
            return;
          }

          setAuthState({
            status: AUTH_STATUS.LOGGED_OUT,
            tokens: null,
            phoneToken: null,
            phone: '',
            user: null,
          });
          return;
        }

        setAuthState((prev) => ({
          ...prev,
          tokens,
          phone: prev.phone,
          status: AUTH_STATUS.BOOTSTRAPPING,
        }));

        await ensureFirebaseSession(tokens.accessToken);

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
            phone: '',
            user: nextUser,
          });
          await clearOnboardingPhoneToken();
        } catch (error) {
          if (shouldResetAfterAuthMeError(error)) {
            await resetInvalidAuthMeSession();
            return;
          }
          if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
            await logout();
          } else if (mounted) {
            setAuthState((prev) => ({
              ...prev,
              status: AUTH_STATUS.AUTHENTICATED,
              tokens,
            }));
          }
        }
      } catch {
        if (mounted) {
          setAuthState({
            status: AUTH_STATUS.LOGGED_OUT,
            tokens: null,
            phoneToken: null,
            phone: '',
            user: null,
          });
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [
    ensureFirebaseSession,
    logout,
    resetInvalidAuthMeSession,
    shouldResetAfterAuthMeError,
  ]);

  return useMemo<AuthContextType>(
    () => ({
      authState,
      loading,
      bootstrappingLoading,
      locationState,
      sendOtpCode: sendOtpCodeWithState,
      refreshMe: refreshMeWithState,
      verifyOtpAndSignIn: verifyOtpAndSignInWithState,
      resendOtpCode: resendOtpCodeWithState,
      completeOnboarding: completeOnboardingWithState,
      enterMainTabs: enterMainTabsWithState,
      completeWelcomeAndEnterMainTabs: completeWelcomeAndEnterMainTabsWithState,
      syncDeviceSessionRegistration,
      logout: logoutWithState,
    }),
    [
      authState,
      loading,
      bootstrappingLoading,
      locationState,
      sendOtpCodeWithState,
      refreshMeWithState,
      verifyOtpAndSignInWithState,
      resendOtpCodeWithState,
      completeOnboardingWithState,
      enterMainTabsWithState,
      completeWelcomeAndEnterMainTabsWithState,
      syncDeviceSessionRegistration,
      logoutWithState,
    ],
  );
}
