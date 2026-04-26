export * from '@/utils/layout';
export * from '@/utils/mask';
export * from '@/utils/options';
export * from '@/types/screen-names';
export * from '@/utils/theme';
export * from '@/utils/token';
export * from '@/utils/toast';
export * from '@/utils/profile';
export * from '@/utils/referral';
export * from '@/utils/home';
export * from '@/utils/validation';
export * from '@/utils/firebase-session';
export * from '@/modules/location/utils/distance.util';
export * from '@/modules/location/utils/location.mapper';

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

