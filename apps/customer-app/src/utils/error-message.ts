import { parseApiError, sanitizeApiMessage } from '@/utils/api-error';

export function sanitizeErrorMessage(value: unknown, fallback: string) {
  return sanitizeApiMessage(value, fallback);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const parsed = parseApiError({ error });
  return parsed.friendlyMessage || fallback;
}
