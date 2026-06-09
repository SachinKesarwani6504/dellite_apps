export { normalizeCityName } from '@/utils/location';
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
export * from '@/utils/home-screen';
export * from '@/utils/booking-flow';
export * from '@/utils/booking-details';
export * from '@/utils/live-tracking';
export * from '@/utils/live-route';
export * from '@/utils/svgicons';
export * from '@/utils/booking-catalog';
export * from '@/utils/customer-bookings';
export * from '@/utils/customer-booking-counts';
export * from '@/utils/customer-navigation';
export * from '@/utils/service-pricing';
export * from '@/utils/pricing/calculateLineSubtotal';
export * from '@/utils/pricing/pricing.constants';
export * from '@/utils/pricing/pricing.types';
export * from '@/utils/date-time';
export * from '@/utils/image-cache';
export * from '@/utils/idempotency';
export * from '@/utils/otp';
export * from '@/utils/validation';
export * from '@/utils/firebase-session';
export * from '@/utils/error-message';
export * from '@/utils/api-error';
export * from '@/utils/device-session';
export * from '@/utils/notification-channel';
export * from '@/utils/in-app-notification';
export * from '@/utils/live-notifications';
export * from '@/utils/live-event-navigation';
export * from '@/utils/banner-navigation';
export * from '@/modules/location/utils/distance.util';
export * from '@/modules/location/utils/location.mapper';

export function extractImageUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
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

export function formatBookingScheduleLabel(date: string, time: string): string {
  const [year, month, day] = date.split('-');
  const [rawHour, rawMinute] = time.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (
    !year
    || !month
    || !day
    || !Number.isFinite(hour)
    || !Number.isFinite(minute)
  ) {
    return `${date} at ${time}`;
  }

  const displayHour = hour % 12 || 12;
  const meridiem = hour >= 12 ? 'pm' : 'am';
  const hourLabel = String(displayHour).padStart(2, '0');
  const minuteLabel = String(minute).padStart(2, '0');

  return `${day}-${month}-${year} at ${hourLabel}:${minuteLabel} ${meridiem}`;
}

