import { APP_TEXT } from '@/utils/appText';

export function getUserCreatedAt(value: unknown): string | number | Date | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const direct = source.createdAt;
  if (typeof direct === 'string' || typeof direct === 'number' || direct instanceof Date) {
    return direct;
  }

  const snakeCase = source.created_at;
  if (typeof snakeCase === 'string' || typeof snakeCase === 'number' || snakeCase instanceof Date) {
    return snakeCase;
  }

  return null;
}

export function formatDateToDdMmmYyyy(value: unknown, fallback = 'N/A'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function toDisplayGender(value?: unknown, fallback?: string): string {
  const fallbackText = fallback ?? APP_TEXT.profile.notProvided;
  if (typeof value !== 'string' || !value.trim()) return fallbackText;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'male') return 'Male';
  if (normalized === 'female') return 'Female';
  if (normalized === 'other') return 'Other';
  return value;
}
