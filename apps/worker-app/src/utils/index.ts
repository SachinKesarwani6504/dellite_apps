export { normalizeCityName } from '@/utils/location';
export * from '@/utils/text';
export * from '@/utils/media';
import { parseApiError } from '@/utils/api-error';
import { formatDisplayDate } from '@/utils/date-display';

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

export function formatDateToDdMmmYyyy(value?: string | number | Date | null): string {
  return formatDisplayDate(value, { fallback: '--' });
}

// Keep reusable helpers here (avoid defining helpers inside screens/components).
export function getErrorMessage(error: unknown, fallback: string): string {
  const parsed = parseApiError({ error });
  if (parsed.friendlyMessage) return parsed.friendlyMessage;
  return fallback;
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
export function formatTitle(value?: string, fallback = 'Unknown') {
  if (!value || !value.trim()) return fallback;
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export * from '@/utils/profile';
export * from '@/utils/referral';
export * from '@/utils/rating';
export * from '@/utils/onboarding';
export * from '@/utils/date';
export * from '@/utils/date-display';
export * from '@/utils/certificate-onboarding';
export * from '@/utils/certificate-payload';
export * from '@/utils/firebase-session';
export * from '@/utils/locationDistance';
export * from '@/utils/worker-live';
export * from '@/utils/booking-details';
export * from '@/utils/history-timeline';
export * from '@/utils/live-tracking';
export * from '@/utils/live-route';
export * from '@/utils/svgicons';
export * from '@/utils/image-cache';
export * from '@/utils/otp';
export * from '@/utils/file-upload';
export * from '@/utils/worker-status';
export * from '@/utils/worker-skills';
export * from '@/utils/status-badge';
export * from '@/utils/worker-jobs';
export * from '@/utils/worker-finance';
export * from '@/utils/api-error';
export * from '@/utils/device-session';
export * from '@/utils/notification-channel';
export * from '@/utils/notification-handler';
export * from '@/utils/in-app-notification';
export * from '@/utils/live-notifications';
export * from '@/utils/live-event-navigation';
export * from '@/utils/notifications';
export * from '@/utils/notification-sound';
export * from '@/utils/notification-history-events';
export * from '@/utils/banner-navigation';
export * from '@/utils/native-map';
export * from '@/utils/appBadge';
export * from '@/modules/location/utils/distance.util';
export * from '@/modules/location/utils/location.mapper';
