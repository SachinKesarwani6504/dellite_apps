export function toBearerToken(value: string): string {
  const trimmed = value.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed : `Bearer ${trimmed}`;
}

export function stripBearerPrefix(value: string): string {
  return value.trim().replace(/^Bearer\s+/i, '');
}

export function maskPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length <= 4) return phoneNumber;
  return `+91${digits.slice(0, 2)}****${digits.slice(-4)}`;
}

export function titleCase(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function formatDateToDdMmmYyyy(value?: string | number | Date | null): string {
  if (value == null) {
    return '--';
  }

  const normalized = typeof value === 'string' ? value.trim() : value;
  if (typeof normalized === 'string' && !normalized) {
    return '--';
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = parsed.toLocaleString('en-US', { month: 'short' });
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

// Keep reusable helpers here (avoid defining helpers inside screens/components).
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message.trim();
  }
  return fallback;
}

export function extractImageUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const candidates = [raw.url, raw.fileUrl, raw.file_url, raw.uri];
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

export function formatInrCurrency(value?: number): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `\u20B9${amount.toLocaleString('en-IN')}`;
}

export function formatSignedPercent(value?: number | string): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  const growth = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const sign = growth > 0 ? '+' : '';
  return `${sign}${growth}%`;
}

export * from '@/utils/profile';
export * from '@/utils/referral';
export * from '@/utils/onboarding';
export * from '@/utils/date';
export * from '@/utils/certificate-onboarding';
export * from '@/utils/certificate-payload';
export * from '@/utils/firebase-session';
export * from '@/utils/locationDistance';
export * from '@/utils/worker-live';
export * from '@/utils/image-cache';
export * from '@/utils/otp';
export * from '@/utils/file-upload';
export * from '@/utils/worker-status';
export * from '@/modules/location/utils/distance.util';
export * from '@/modules/location/utils/location.mapper';
