import { ApiError } from '@/types/api';

export const forcedSessionLogoutMessage = 'You were logged out because this app was signed in on another device.';

const FORCED_SESSION_LOGOUT_CODES = new Set([
  'SESSION_REVOKED',
  'DEVICE_MISMATCH',
  'ROLE_SESSION_REPLACED',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function extractApiErrorCode(payload: unknown): string | null {
  if (!isRecord(payload)) return null;

  const rootCode = payload.code;
  if (typeof rootCode === 'string' && rootCode.trim()) return rootCode.trim();

  if (isRecord(payload.data)) {
    const nestedCode = payload.data.code;
    if (typeof nestedCode === 'string' && nestedCode.trim()) return nestedCode.trim();
  }

  return null;
}

export function isForcedSessionLogoutCode(code: string | null | undefined) {
  return Boolean(code && FORCED_SESSION_LOGOUT_CODES.has(code));
}

export function isForcedSessionLogoutError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.statusCode !== 401 && error.statusCode !== 403) return false;
  return isForcedSessionLogoutCode(extractApiErrorCode(error.payload));
}
