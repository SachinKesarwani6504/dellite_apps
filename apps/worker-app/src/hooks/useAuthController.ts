import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  createProfileWithPhoneToken,
  getMe,
  logoutCurrentSession,
  resendOtp,
  sendOtp,
  verifyOtp,
} from '@/actions';
import { ApiError } from '@/types/api';
import { AuthContextType } from '@/types/auth-context';
import { AuthStatus } from '@/types/auth-status';
import { APP_AUTH_ROLE, AuthMeResponse, AuthUser, UserRole, WorkerProfilePayload } from '@/types/auth';
import { useLocationController } from '@/hooks/useLocationController';
import { stripBearerPrefix } from '@/utils/token';
import {
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
} from '@/utils/key-chain-storage/auth-storage';
import {
  clearOnboardingPhoneToken,
  getOnboardingPhoneToken,
  saveOnboardingPhoneToken,
} from '@/utils/key-chain-storage/onboarding-storage';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function normalizeTokenValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = stripBearerPrefix(value);
  return normalized.length > 0 ? normalized : undefined;
}

function findTokenInPayload(payload: unknown, tokenKind: 'access' | 'refresh'): string | undefined {
  const queue: unknown[] = [payload];
  const visited = new Set<unknown>();
  const directKeys = tokenKind === 'access'
    ? ['accessToken', 'access_token']
    : ['refreshToken', 'refresh_token'];
  const nestedKeys = tokenKind === 'access'
    ? ['accessToken', 'access_token']
    : ['refreshToken', 'refresh_token'];

  let hops = 0;
  while (queue.length > 0 && hops < 250) {
    const current = queue.shift();
    hops += 1;
    if (!isRecord(current) || visited.has(current)) continue;
    visited.add(current);

    for (let index = 0; index < directKeys.length; index += 1) {
      const tokenValue = normalizeTokenValue(current[directKeys[index]]);
      if (tokenValue) return tokenValue;
    }

    const nested = current.tokens;
    if (isRecord(nested)) {
      for (let index = 0; index < nestedKeys.length; index += 1) {
        const nestedTokenValue = normalizeTokenValue(nested[nestedKeys[index]]);
        if (nestedTokenValue) return nestedTokenValue;
      }
    }

    const values = Object.values(current);
    for (let index = 0; index < values.length; index += 1) {
      if (isRecord(values[index])) {
        queue.push(values[index]);
      }
    }
  }

  return undefined;
}

async function setSessionTokens(accessToken: string, refreshToken: string) {
  await saveAuthTokens({
    accessToken: stripBearerPrefix(accessToken),
    refreshToken: stripBearerPrefix(refreshToken),
  });
}

async function clearAllStoredTokens() {
  await clearAuthTokens();
  await clearOnboardingPhoneToken();
}

export function useAuthController(): AuthContextType {
  const locationState = useLocationController();
  const { initializeLocation } = locationState;
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.BOOTSTRAPPING);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [me, setMe] = useState<AuthMeResponse | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneVerificationToken, setPhoneVerificationToken] = useState<string | null>(null);
  const [pendingActionCount, setPendingActionCount] = useState(0);
  const foregroundSyncInFlightRef = useRef(false);
  const lastForegroundSyncAtRef = useRef(0);
  const inFlightRefreshMeRef = useRef<Promise<AuthMeResponse> | null>(null);

  const loading = pendingActionCount > 0;

  const runWithActionState = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
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
        const meResponse = (await getMe()) as AuthMeResponse;
        setMe(meResponse);
        setUser(meResponse.user);
        return meResponse;
      })().finally(() => {
        inFlightRefreshMeRef.current = null;
      }) as Promise<AuthMeResponse>;
    }

    return inFlightRefreshMeRef.current;
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const [tokens, pendingPhoneTokenRaw] = await Promise.all([
        getAuthTokens(),
        getOnboardingPhoneToken(),
      ]);
      const pendingPhoneToken = pendingPhoneTokenRaw ? stripBearerPrefix(pendingPhoneTokenRaw) : null;
      const accessToken = tokens?.accessToken ? stripBearerPrefix(tokens.accessToken) : null;

      if (accessToken) {
        setPhoneVerificationToken(pendingPhoneToken);
        await refreshMe();
        setStatus(AuthStatus.AUTHENTICATED);
        return;
      }

      if (pendingPhoneToken) {
        setPhoneVerificationToken(pendingPhoneToken);
        setStatus(AuthStatus.PHONE_VERIFIED);
        return;
      }

      setPhoneVerificationToken(null);
      setStatus(AuthStatus.LOGGED_OUT);
    } catch {
      await clearAllStoredTokens();
      setPhoneVerificationToken(null);
      setStatus(AuthStatus.LOGGED_OUT);
    }
  }, [refreshMe]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') return;
      if (status !== AuthStatus.AUTHENTICATED && status !== AuthStatus.PHONE_VERIFIED) return;
      if (foregroundSyncInFlightRef.current) return;

      const now = Date.now();
      if (now - lastForegroundSyncAtRef.current < 5000) {
        return;
      }

      foregroundSyncInFlightRef.current = true;
      lastForegroundSyncAtRef.current = now;
      void Promise.all([
        bootstrap(),
        initializeLocation({ forceRefresh: true }),
      ]).finally(() => {
        foregroundSyncInFlightRef.current = false;
      });
    });

    return () => {
      subscription.remove();
    };
  }, [bootstrap, initializeLocation, status]);

  const handleSendOtpCode = useCallback(async (phoneNumber: string, role: UserRole = APP_AUTH_ROLE) => {
    await clearAllStoredTokens();
    setPhoneVerificationToken(null);
    setMe(null);
    setUser(null);
    await sendOtp({ phone: phoneNumber, role });
    setPhone(phoneNumber);
    setStatus(AuthStatus.OTP_SENT);
  }, []);

  const handleVerifyOtpCode = useCallback(
    async (phoneNumber: string, otp: string) => {
      const response = await verifyOtp({ phone: phoneNumber, otp, role: APP_AUTH_ROLE });
      setPhone(phoneNumber);
      const accessToken = response.accessToken ? stripBearerPrefix(response.accessToken) : null;
      const refreshToken = response.refreshToken ? stripBearerPrefix(response.refreshToken) : null;

      if (response.phoneToken) {
        const cleanPhoneToken = stripBearerPrefix(response.phoneToken);
        if (accessToken && refreshToken) {
          await setSessionTokens(accessToken, refreshToken);
        }
        setPhoneVerificationToken(cleanPhoneToken);
        await saveOnboardingPhoneToken(cleanPhoneToken);
        setStatus(AuthStatus.PHONE_VERIFIED);
        return;
      }

      if (accessToken && refreshToken) {
        await setSessionTokens(accessToken, refreshToken);
        await clearOnboardingPhoneToken();
        setPhoneVerificationToken(null);
        setStatus(AuthStatus.AUTHENTICATED);
        await refreshMe();
        return;
      }

      throw new Error('OTP verified, but no valid token set was returned.');
    },
    [refreshMe],
  );

  const handleResendOtpCode = useCallback(async (phoneNumber: string) => {
    await resendOtp(phoneNumber);
  }, []);

  const handleCompleteOnboarding = useCallback(
    async (payload: WorkerProfilePayload) => {
      const restoredPhoneTokenRaw = await getOnboardingPhoneToken();
      const restoredPhoneToken = restoredPhoneTokenRaw ? stripBearerPrefix(restoredPhoneTokenRaw) : null;
      const phoneToken = phoneVerificationToken ?? restoredPhoneToken;

      if (phoneToken && phoneToken !== phoneVerificationToken) {
        setPhoneVerificationToken(phoneToken);
      }

      if (!phoneToken) {
        throw new Error('Session expired. Please verify OTP again.');
      }

      let response: {
        accessToken?: string;
        refreshToken?: string;
        access_token?: string;
        refresh_token?: string;
        tokens?: { accessToken?: string; refreshToken?: string };
        data?: unknown;
        result?: unknown;
        payload?: unknown;
      };

      try {
        response = (await createProfileWithPhoneToken(payload)) as {
          accessToken?: string;
          refreshToken?: string;
          access_token?: string;
          refresh_token?: string;
          tokens?: { accessToken?: string; refreshToken?: string };
        };
      } catch (error) {
        if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
          setPhoneVerificationToken(null);
          setStatus(AuthStatus.LOGGED_OUT);
        }
        throw error;
      }

      const accessToken = findTokenInPayload(response, 'access');
      const refreshToken = findTokenInPayload(response, 'refresh');

      if (accessToken && refreshToken) {
        await setSessionTokens(accessToken, refreshToken);
      } else {
        const existingTokens = await getAuthTokens();
        const existingAccessToken = existingTokens?.accessToken ? stripBearerPrefix(existingTokens.accessToken) : null;
        const existingRefreshToken = existingTokens?.refreshToken ? stripBearerPrefix(existingTokens.refreshToken) : null;
        if (!existingAccessToken || !existingRefreshToken) {
          throw new Error('Profile created, but auth tokens are missing.');
        }
      }

      setPhoneVerificationToken(null);
      await clearOnboardingPhoneToken();
      setStatus(AuthStatus.AUTHENTICATED);

      try {
        await refreshMe();
      } catch {
        // Keep authenticated state and retry me fetch later.
      }
    },
    [phoneVerificationToken, refreshMe],
  );

  const handleLogout = useCallback(async () => {
    try {
      const tokens = await getAuthTokens();
      const refreshToken = tokens?.refreshToken ? stripBearerPrefix(tokens.refreshToken) : null;
      if (refreshToken) {
        await logoutCurrentSession(refreshToken);
      }
    } catch {
      // Even if API logout fails, we clear local session for safety.
    } finally {
      await clearAllStoredTokens();
      setPhoneVerificationToken(null);
      setMe(null);
      setUser(null);
      setPhone('');
      setStatus(AuthStatus.LOGGED_OUT);
    }
  }, []);

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

  const logout = useCallback(
    () => runWithActionState(handleLogout),
    [handleLogout, runWithActionState],
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
    phone,
    isAuthenticated: status === AuthStatus.AUTHENTICATED,
    locationState,
    sendOtpCode,
    verifyOtpCode,
    resendOtpCode,
    completeOnboarding,
    logout,
    refreshMe: refreshMeWithState,
  }), [
    user,
    me,
    status,
    loading,
    phone,
    locationState,
    sendOtpCode,
    verifyOtpCode,
    resendOtpCode,
    completeOnboarding,
    logout,
    refreshMeWithState,
  ]);
}
