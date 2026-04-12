import { AuthTokens } from '@/types/auth';
import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';
import {
  getSecureValue,
  removeSecureValue,
  saveSecureValue,
} from '@/utils/key-chain-storage/key-chain-service';

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

  const accessToken = directAccess ?? nestedAccess;
  const refreshToken = directRefresh ?? nestedRefresh;

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await saveSecureValue(
    keyChainValues.authService,
    keyChainValues.authUsername,
    JSON.stringify(tokens),
  );
}

export async function getAuthTokens(): Promise<AuthTokens | null> {
  const value = await getSecureValue(keyChainValues.authService, keyChainValues.authUsername);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return normalizeAuthTokens(parsed);
  } catch {
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  await removeSecureValue(keyChainValues.authService, keyChainValues.authUsername);
}
