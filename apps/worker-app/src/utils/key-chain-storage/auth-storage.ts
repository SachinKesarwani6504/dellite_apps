import { AuthTokens } from '@/types/auth';
import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';
import {
  getSecureValue,
  removeSecureValue,
  saveSecureValue,
} from '@/utils/key-chain-storage/key-chain-service';

const legacyAuthKeyChainValues = [
  { service: 'dellite.worker.tokens', username: 'auth' },
  { service: 'dellite.tokens', username: 'auth' },
] as const;

let cachedAuthTokens: AuthTokens | null | undefined;

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
  cachedAuthTokens = tokens;
  logAuthStorage('save:start', {
    service: keyChainValues.authService,
    username: keyChainValues.authUsername,
    hasAccessToken: Boolean(tokens.accessToken),
    hasRefreshToken: Boolean(tokens.refreshToken),
    hasFirebaseCustomToken: Boolean(tokens.firebaseCustomToken),
  });
  await saveSecureValue(
    keyChainValues.authService,
    keyChainValues.authUsername,
    JSON.stringify(tokens),
  );
  const readBack = await getSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  logAuthStorage('save:done', { hasReadBack: Boolean(readBack) });
}

export async function getAuthTokens(): Promise<AuthTokens | null> {
  if (typeof cachedAuthTokens !== 'undefined') {
    return cachedAuthTokens;
  }

  const value = await getSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  if (value) {
    try {
      const parsed = JSON.parse(value);
      const normalized = normalizeAuthTokens(parsed);
      cachedAuthTokens = normalized;
      return normalized;
    } catch {
      logAuthStorage('get:parse-failed');
      cachedAuthTokens = null;
      return null;
    }
  }

  for (const legacyKey of legacyAuthKeyChainValues) {
    const legacyValue = await getSecureValue(legacyKey.service, legacyKey.username);
    if (!legacyValue) continue;

    try {
      const parsed = JSON.parse(legacyValue);
      const tokens = normalizeAuthTokens(parsed);
      if (!tokens) continue;

      await saveAuthTokens(tokens);
      await removeSecureValue(legacyKey.service, legacyKey.username);
      logAuthStorage('get:migrated-legacy', { service: legacyKey.service, username: legacyKey.username });
      return tokens;
    } catch {
      logAuthStorage('get:legacy-parse-failed', { service: legacyKey.service, username: legacyKey.username });
      continue;
    }
  }

  cachedAuthTokens = null;
  return null;
}

export async function clearAuthTokens(): Promise<void> {
  cachedAuthTokens = null;
  logAuthStorage('clear:start', {
    service: keyChainValues.authService,
    username: keyChainValues.authUsername,
  });
  await removeSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  const readBack = await getSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  logAuthStorage('clear:done', { hasReadBack: Boolean(readBack) });
}
