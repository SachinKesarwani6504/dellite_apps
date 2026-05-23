import { AuthTokens } from '@/types/auth';
import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';
import {
  getSecureValue,
  removeSecureValue,
  saveSecureValue,
} from '@/utils/key-chain-storage/key-chain-service';

function logAuthStorage(step: string, payload?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-auth-storage] ${step}`, payload);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function asToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/^Bearer\s+/i, '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeAuthTokens(raw: unknown): AuthTokens | null {
  if (!isRecord(raw)) return null;

  const directAccess = asToken(raw.accessToken) ?? asToken(raw.access_token);
  const directRefresh = asToken(raw.refreshToken) ?? asToken(raw.refresh_token);

  const nestedTokens = isRecord(raw.tokens) ? raw.tokens : undefined;
  const nestedAccess = nestedTokens ? (asToken(nestedTokens.accessToken) ?? asToken(nestedTokens.access_token)) : undefined;
  const nestedRefresh = nestedTokens ? (asToken(nestedTokens.refreshToken) ?? asToken(nestedTokens.refresh_token)) : undefined;
  const directFirebaseCustomToken = asToken(raw.firebaseCustomToken) ?? asToken(raw.firebase_custom_token);
  const nestedFirebaseCustomToken = nestedTokens
    ? (asToken(nestedTokens.firebaseCustomToken) ?? asToken(nestedTokens.firebase_custom_token))
    : undefined;

  const accessToken = directAccess ?? nestedAccess;
  const refreshToken = directRefresh ?? nestedRefresh;
  const firebaseCustomToken = directFirebaseCustomToken ?? nestedFirebaseCustomToken;

  if (!accessToken || !refreshToken) return null;
  return {
    accessToken,
    refreshToken,
    ...(firebaseCustomToken ? { firebaseCustomToken } : {}),
  };
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  logAuthStorage('save:start', {
    service: keyChainValues.authService,
    username: keyChainValues.authUsername,
    tokens,
  });
  await saveSecureValue(
    keyChainValues.authService,
    keyChainValues.authUsername,
    JSON.stringify(tokens),
  );
  const readBack = await getSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  logAuthStorage('save:done', { readBack });
}

export async function getAuthTokens(): Promise<AuthTokens | null> {
  const value = await getSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    const normalized = normalizeAuthTokens(parsed);
    return normalized;
  } catch {
    logAuthStorage('get:parse-failed');
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  logAuthStorage('clear:start', {
    service: keyChainValues.authService,
    username: keyChainValues.authUsername,
  });
  await removeSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  const readBack = await getSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  logAuthStorage('clear:done', { readBack });
}
