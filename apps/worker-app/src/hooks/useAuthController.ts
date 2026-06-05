import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createProfileWithPhoneToken,
  getWorkerOnboardingPrefill,
  getMe,
  logoutCurrentSession,
  resendOtp,
  sendOtp,
  updateDeviceSession,
  verifyOtp
} from '@/actions';
import { ApiError } from '@/types/api';
import { AuthContextType } from '@/types/auth-context';
import { AuthStatus } from '@/types/auth-status';
import {
  APP_AUTH_ROLE,
  AuthMeResponse,
  AuthTokens,
  AuthUser,
  UserRole,
  VerifyOtpResult,
  WorkerOnboardingPrefillData,
  WorkerProfilePayload,
} from '@/types/auth';
import { useLocationController } from '@/hooks/useLocationController';
import { clearFirebaseAuthSession, ensureFirebaseSessionWithCustomToken } from '@/utils/firebase-session';
import { buildDeviceSessionPayload } from '@/utils/device-session';
import {
  forcedSessionLogoutMessage,
  isForcedSessionLogoutError,
} from '@/utils/session-errors';
import {
  getNotificationPermissionStatusFromDevice,
  requestNotificationPermissionFromDevice,
  syncPendingPushTokenFromDevice,
} from '@/lib/permission';
import {
  clearAuthTokens,
  clearOnboardingPhoneToken,
  getAuthTokens,
  getOnboardingPhoneToken,
  getSecureValue,
  keyChainValues,
  saveAuthTokens,
  saveOnboardingPhoneToken,
} from '@/utils/key-chain-storage';
import { stripBearerPrefix } from '@/utils/token';
import { showApiSuccessToast, showError } from '@/utils/toast';

function normalizeBearerToken(token: string | null | undefined) {
  if (!token) {
    return '';
  }

  return stripBearerPrefix(token);
}

function extractTokensFromVerifyOtpResponse(response: VerifyOtpResult & { status?: string }): AuthTokens | null {
  if (response.status === 'NEEDS_PROFILE_CREATION' || response.status === 'NEEDS_ROLE_CREATION') {
    return null;
  }
  if (!response.accessToken || !response.refreshToken) {
    return null;
  }

  return {
    accessToken: normalizeBearerToken(response.accessToken),
    refreshToken: normalizeBearerToken(response.refreshToken),
    ...(response.firebaseCustomToken
      ? { firebaseCustomToken: normalizeBearerToken(response.firebaseCustomToken) }
      : {}),
  };
}

function extractPhoneTokenFromVerifyOtpResponse(response: VerifyOtpResult & { status?: string }): string | null {
  if (response.status === 'LOGIN_SUCCESS') {
    return null;
  }
  return response.phoneToken ? normalizeBearerToken(response.phoneToken) : null;
}

async function clearAllStoredTokens() {
  await clearAuthTokens();
  await clearOnboardingPhoneToken();
  await clearFirebaseAuthSession();
}

export function useAuthController(): AuthContextType {
  const locationState = useLocationController();
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.BOOTSTRAPPING);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [me, setMe] = useState<AuthMeResponse | null>(null);
  const [onboardingPrefill, setOnboardingPrefill] = useState<WorkerOnboardingPrefillData | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneToken, setPhoneToken] = useState<string | null>(null);
  const [pendingActionCount, setPendingActionCount] = useState(0);
  const inFlightRefreshMeRef = useRef<Promise<AuthMeResponse> | null>(null);
  const inFlightDeviceSessionSyncRef = useRef<Promise<void> | null>(null);
  const lastDeviceSessionPayloadFingerprintRef = useRef<string | null>(null);
  const statusRef = useRef<AuthStatus>(AuthStatus.BOOTSTRAPPING);
  const phoneTokenRef = useRef<string | null>(null);

  const loading = pendingActionCount > 0;
  const bootstrappingLoading = status === AuthStatus.BOOTSTRAPPING;

  useEffect(() => {
    statusRef.current = status;
    phoneTokenRef.current = phoneToken;
  }, [phoneToken, status]);

  const runWithActionState = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setPendingActionCount(count => count + 1);
    try {
      return await operation();
    } finally {
      setPendingActionCount(count => Math.max(0, count - 1));
    }
  }, []);

  const refreshMe = useCallback(async (): Promise<AuthMeResponse> => {
    if (!inFlightRefreshMeRef.current) {
      inFlightRefreshMeRef.current = (async () => {
        const meResponse = await getMe();
        setMe(meResponse);
        setUser(meResponse.user);
        return meResponse;
      })().finally(() => {
        inFlightRefreshMeRef.current = null;
      }) as Promise<AuthMeResponse>;
    }

    return inFlightRefreshMeRef.current;
  }, []);

  const ensureFirebaseSession = useCallback(async (firebaseCustomToken?: string | null) => {
    const normalizedToken = firebaseCustomToken ? normalizeBearerToken(firebaseCustomToken) : null;

    if (normalizedToken) {
      await ensureFirebaseSessionWithCustomToken(normalizedToken, { forceReauth: true });
      return;
    }

    const tokens = await getAuthTokens();
    await ensureFirebaseSessionWithCustomToken(tokens?.firebaseCustomToken ?? null, { forceReauth: true });
  }, []);

  const handleForcedSessionLogout = useCallback(async () => {
    lastDeviceSessionPayloadFingerprintRef.current = null;
    await clearAllStoredTokens();
    setPhoneToken(null);
    setOnboardingPrefill(null);
    setMe(null);
    setUser(null);
    setPhone('');
    setStatus(AuthStatus.LOGGED_OUT);
    showError(forcedSessionLogoutMessage);
  }, []);

  const promptNotificationPermissionForDeviceSession = useCallback(async () => {
    const currentStatus = await getNotificationPermissionStatusFromDevice();

    if (currentStatus === 'granted') {
      return currentStatus;
    }

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[worker-auth] device-session-notification-permission-request-start', {
        currentStatus,
      });
    }

    const nextStatus = await requestNotificationPermissionFromDevice();

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[worker-auth] device-session-notification-permission-request-complete', {
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
        console.log('[worker-auth] profile-device-info-push-token-fetch-failed', error);
      }
    }

    try {
      const payload = await buildDeviceSessionPayload('WORKER');
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[worker-auth] profile-device-info-ready', {
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
        console.log('[worker-auth] profile-device-info-build-failed', error);
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
        console.log('[worker-auth] device-session-sync-start', { mode: 'update' });
      }

      const tokens = await getAuthTokens();
      if (!tokens?.accessToken) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[worker-auth] device-session-skipped-no-access-token', { mode: 'update' });
        }
        return;
      }

      try {
        await syncPendingPushTokenFromDevice();
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[worker-auth] device-session-push-token-fetch-failed', error);
        }
      }

      const payload = await buildDeviceSessionPayload('WORKER');
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
          console.log('[worker-auth] device-session-skipped-duplicate-payload', {
            mode: 'update',
            hasPushToken: Boolean(payload.fcmToken),
          });
        }
        return;
      }

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[worker-auth] device-session-upsert-send', {
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

      await updateDeviceSession(payload);
      lastDeviceSessionPayloadFingerprintRef.current = payloadFingerprint;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[worker-auth] device-session-upsert-success', { mode: 'update' });
      }
    } catch (error) {
      if (isForcedSessionLogoutError(error)) {
        await handleForcedSessionLogout();
        return;
      }
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[worker-auth] device-session-upsert-failed', {
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

  const resetLocalSession = useCallback((nextStatus: AuthStatus) => {
    setPhoneToken(null);
    setOnboardingPrefill(null);
    setMe(null);
    setUser(null);
    setStatus(nextStatus);
  }, []);

  const fetchOnboardingPrefill = useCallback(async (rawPhoneToken: string) => {
    const normalizedPhoneToken = normalizeBearerToken(rawPhoneToken);
    if (!normalizedPhoneToken) {
      return null;
    }

    try {
      const prefill = await getWorkerOnboardingPrefill(normalizedPhoneToken);
      setOnboardingPrefill(prefill);
      return prefill;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        await clearOnboardingPhoneToken();
        setPhoneToken(null);
        setOnboardingPrefill(null);
        setPhone('');
        setStatus(AuthStatus.LOGGED_OUT);
        showError('Session expired. Please login again.');
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const tokens = await getAuthTokens();
      if (tokens?.refreshToken) {
        try {
          await logoutCurrentSession(tokens.refreshToken);
        } catch {
          // Local logout should still succeed when the server session is already gone.
        }
      }
    } finally {
      lastDeviceSessionPayloadFingerprintRef.current = null;
      await clearAllStoredTokens();
      resetLocalSession(AuthStatus.LOGGED_OUT);
      setPhone('');
    }
  }, [resetLocalSession]);

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
            const normalizedPendingPhoneToken = normalizeBearerToken(pendingPhoneToken);
            setStatus(AuthStatus.ONBOARDING);
            setPhoneToken(normalizedPendingPhoneToken);
            setMe(null);
            setUser(null);
            if (normalizedPendingPhoneToken) {
              try {
                await fetchOnboardingPrefill(normalizedPendingPhoneToken);
              } catch {
                // Non-blocking prefill fetch failure; user can continue manually.
              }
            }
            return;
          }

          resetLocalSession(AuthStatus.LOGGED_OUT);
          return;
        }

        setStatus(AuthStatus.BOOTSTRAPPING);
        setPhoneToken(null);
        await ensureFirebaseSession(tokens.firebaseCustomToken ?? null);

        try {
          await refreshMe();
          if (!mounted) {
            return;
          }
          await clearOnboardingPhoneToken();
          setStatus(AuthStatus.AUTHENTICATED);
        } catch {
          await logout();
        }
      } catch {
        if (mounted) {
          await clearAllStoredTokens();
          resetLocalSession(AuthStatus.LOGGED_OUT);
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [
    ensureFirebaseSession,
    fetchOnboardingPrefill,
    logout,
    refreshMe,
    resetLocalSession,
  ]);

  const handleSendOtpCode = useCallback(async (phoneNumber: string, role: UserRole = APP_AUTH_ROLE) => {
    console.log('[Auth Flow] Sending OTP to phone:', phoneNumber);
    await sendOtp({ phone: phoneNumber, role });
    setPhone(phoneNumber);
    setOnboardingPrefill(null);
    setStatus(AuthStatus.OTP_SENT);
  }, []);

  const handleVerifyOtpCode = useCallback(
    async (phoneNumber: string, otp: string) => {
      console.log('[Auth Flow] Verifying OTP:', { phoneNumber, otp });
      const response = await verifyOtp({ phone: phoneNumber, otp, role: APP_AUTH_ROLE });
      if (typeof response.message === 'string' && response.message.trim().length > 0) {
        showApiSuccessToast(response.message);
      }
      console.log('[Auth Flow] OTP Verification Response:', response);
      setPhone(phoneNumber);

      const statusResult = response.status;

      // CASE 1: NEEDS PROFILE/ROLE CREATION -> Enter Onboarding
      if (statusResult === 'NEEDS_PROFILE_CREATION' || statusResult === 'NEEDS_ROLE_CREATION' || (!statusResult && extractPhoneTokenFromVerifyOtpResponse(response))) {
        const onboardingPhoneToken = extractPhoneTokenFromVerifyOtpResponse(response);
        if (!onboardingPhoneToken) {
          throw new Error('Profile creation required, but no phone token was returned.');
        }
        console.log('[Auth Flow] Extracted Onboarding Phone Token:', onboardingPhoneToken);
        await clearAuthTokens();
        await saveOnboardingPhoneToken(onboardingPhoneToken);
        console.log(`[Auth Flow] Saved Onboarding Phone Token in secure storage [Service: ${keyChainValues.onboardingService}, Key: ${keyChainValues.onboardingUsername}]`);
        setPhoneToken(onboardingPhoneToken);
        setOnboardingPrefill(null);
        setMe(null);
        setUser(null);
        setStatus(AuthStatus.ONBOARDING);

        try {
          await fetchOnboardingPrefill(onboardingPhoneToken);
        } catch (error) {
          if (error instanceof ApiError && error.statusCode === 401) {
            return;
          }
          if (error instanceof ApiError && error.statusCode === 403) {
            await clearOnboardingPhoneToken();
            setPhoneToken(null);
            setOnboardingPrefill(null);
            setStatus(AuthStatus.OTP_SENT);
            showError('Session mismatch. Please verify OTP again.');
            return;
          }
          showError('Couldn’t fetch prefill. Please enter details manually.');
        }
        return;
      }

      // CASE 2: LOGIN SUCCESS -> Authenticate Session
      const tokens = extractTokensFromVerifyOtpResponse(response);
      console.log('[Auth Flow] Extracted Session Tokens:', tokens);
      if (!tokens?.accessToken) {
        console.error('[Auth Flow] Invalid token response: No access token found.');
        throw new Error('OTP verified, but no valid token set was returned.');
      }

      await saveAuthTokens(tokens);
      console.log(`[Auth Flow] Saved Auth Tokens in secure storage [Service: ${keyChainValues.authService}, Key: ${keyChainValues.authUsername}]`, tokens);
      await ensureFirebaseSession(tokens.firebaseCustomToken ?? response.firebaseCustomToken ?? null);
      await clearOnboardingPhoneToken();
      setPhoneToken(null);
      setOnboardingPrefill(null);
      setStatus(AuthStatus.AUTHENTICATED);
      await promptNotificationPermissionForDeviceSession();
      void syncDeviceSessionRegistration();
      await refreshMe();
    },
    [
      ensureFirebaseSession,
      promptNotificationPermissionForDeviceSession,
      refreshMe,
      syncDeviceSessionRegistration,
    ],
  );

  const handleResendOtpCode = useCallback(async (phoneNumber: string) => {
    await resendOtp(phoneNumber);
  }, []);

  const handleCompleteOnboarding = useCallback(
    async (payload: WorkerProfilePayload) => {
      console.log('[Auth Flow] Completing onboarding with payload:', payload);
      const storedPhoneTokenRaw = await getOnboardingPhoneToken();
      const storedPhoneTokenNormalized = normalizeBearerToken(storedPhoneTokenRaw);
      const onboardingPhoneToken = phoneToken ?? storedPhoneTokenNormalized;

      // CASE 2: EXPIRED SESSION
      if (!onboardingPhoneToken) {
        await clearAllStoredTokens();
        resetLocalSession(AuthStatus.LOGGED_OUT);
        throw new Error('Your phone verification session expired. Please verify OTP again.');
      }

      // CASE 3: NEW USER CREATING PROFILE
      if (!phoneToken) {
        setPhoneToken(onboardingPhoneToken);
        await saveOnboardingPhoneToken(onboardingPhoneToken);
      }

      let profile: Awaited<ReturnType<typeof createProfileWithPhoneToken>>;
      try {
        await promptNotificationPermissionForDeviceSession();
        const deviceInfo = await buildProfileDeviceInfoBestEffort();
        profile = await createProfileWithPhoneToken({
          ...payload,
          deviceInfo,
        });
      } catch (error) {
        if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
          await clearOnboardingPhoneToken();
          resetLocalSession(AuthStatus.LOGGED_OUT);
        }
        throw error;
      }

      if (!profile.accessToken || !profile.refreshToken) {
        console.error('[Auth Flow] Missing access or refresh token in profile response:', profile);
        throw new Error('Profile created, but auth tokens are missing.');
      }

      const tokens: AuthTokens = {
        accessToken: normalizeBearerToken(profile.accessToken),
        refreshToken: normalizeBearerToken(profile.refreshToken),
        ...(profile.firebaseCustomToken
          ? { firebaseCustomToken: normalizeBearerToken(profile.firebaseCustomToken) }
          : {}),
      };

      await saveAuthTokens(tokens);
      console.log(`[Auth Flow] Saved NEW Auth Tokens after profile creation [Service: ${keyChainValues.authService}, Key: ${keyChainValues.authUsername}]`, tokens);
      await ensureFirebaseSession(tokens.firebaseCustomToken ?? profile.firebaseCustomToken ?? null);
      await clearOnboardingPhoneToken();
      setPhoneToken(null);
      setOnboardingPrefill(null);
      setStatus(AuthStatus.AUTHENTICATED);

      try {
        await refreshMe();
      } catch {
        // Keep the newly authenticated state; a later refresh can reconcile the user snapshot.
      }
    },
    [
      buildProfileDeviceInfoBestEffort,
      ensureFirebaseSession,
      phoneToken,
      promptNotificationPermissionForDeviceSession,
      refreshMe,
      resetLocalSession,
    ],
  );

  const sendOtpCode = useCallback(
    (phoneNumber: string, role?: UserRole) => runWithActionState(() => handleSendOtpCode(phoneNumber, role)),
    [handleSendOtpCode, runWithActionState],
  );

  const verifyOtpCode = useCallback(
    (phoneNumber: string, otp: string) => runWithActionState(() => handleVerifyOtpCode(phoneNumber, otp)),
    [handleVerifyOtpCode, runWithActionState],
  );

  const resendOtpCode = useCallback(
    (phoneNumber: string) => runWithActionState(() => handleResendOtpCode(phoneNumber)),
    [handleResendOtpCode, runWithActionState],
  );

  const completeOnboarding = useCallback(
    (payload: WorkerProfilePayload) => runWithActionState(() => handleCompleteOnboarding(payload)),
    [handleCompleteOnboarding, runWithActionState],
  );

  const logoutWithState = useCallback(
    () => runWithActionState(logout),
    [logout, runWithActionState],
  );

  const refreshMeWithState = useCallback(
    () => runWithActionState(refreshMe),
    [refreshMe, runWithActionState],
  );

  return useMemo<AuthContextType>(() => ({
    user,
    me,
    status,
    loading,
    bootstrappingLoading,
    phone,
    isAuthenticated: status === AuthStatus.AUTHENTICATED,
    locationState,
    onboardingPrefill,
    sendOtpCode,
    verifyOtpCode,
    resendOtpCode,
    completeOnboarding,
    syncDeviceSessionRegistration,
    logout: logoutWithState,
    refreshMe: refreshMeWithState,
    fetchOnboardingPrefill,
  }), [
    user,
    me,
    status,
    loading,
    bootstrappingLoading,
    phone,
    locationState,
    onboardingPrefill,
    sendOtpCode,
    verifyOtpCode,
    resendOtpCode,
    completeOnboarding,
    syncDeviceSessionRegistration,
    logoutWithState,
    refreshMeWithState,
    fetchOnboardingPrefill,
  ]);
}
