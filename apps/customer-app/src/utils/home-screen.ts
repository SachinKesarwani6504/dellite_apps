import { normalizeCityName } from '@/utils/location';
import type { CustomerHomeCategory, CustomerHomePayload, CustomerHomeService } from '@/types/customer';
import { PRICE_TYPE, PRICE_COMPUTATION_MODE } from '@/types/customer';
import { formatPriceOptionPricingLabel } from '@/utils/booking-flow';

export function normalizeForCompare(value?: string | null) {
  if (!value || !value.trim()) return '';
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function extractFooterOnlyHomePayload(payload: unknown): Pick<CustomerHomePayload, 'footer' | 'header'> | null {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as { data?: unknown; footer?: unknown; header?: unknown };
  const data = (source.data && typeof source.data === 'object')
    ? source.data as { footer?: unknown; header?: unknown }
    : null;

  const footer = (data?.footer && typeof data.footer === 'object')
    ? data.footer as CustomerHomePayload['footer']
    : (source.footer && typeof source.footer === 'object')
      ? source.footer as CustomerHomePayload['footer']
      : undefined;

  const header = (data?.header && typeof data.header === 'object')
    ? data.header as CustomerHomePayload['header']
    : (source.header && typeof source.header === 'object')
      ? source.header as CustomerHomePayload['header']
      : undefined;

  if (!footer && !header) return null;
  return { header, footer };
}

export function normalizeHomeQueryCity(value: string | null | undefined): string {
  const trimmed = normalizeCityName(value);
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'your area') return '';
  return trimmed.toUpperCase();
}

export function getPopularFallbackLabel(service: CustomerHomeService) {
  if (service.iconText?.trim()) return service.iconText.trim();
  if (service.category?.iconText?.trim()) return service.category.iconText.trim();
  if (service.name?.trim()) return service.name.trim().charAt(0).toUpperCase();
  return '?';
}

function toNumericPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatPriceTypeLabel(value: string | undefined) {
  if (value === 'FIXED') return 'Fixed';
  if (value === PRICE_TYPE.VISIT) return 'Visit';
  if (value === PRICE_TYPE.HOURLY) return 'Hourly';
  if (value === PRICE_TYPE.DAILY) return 'Daily';
  if (value === PRICE_TYPE.PER_UNIT) return 'Per unit';
  return '';
}

export function formatPopularServicePrice(service: CustomerHomeService): string | null {
  const firstOption = Array.isArray(service.priceOptions) ? service.priceOptions[0] : null;
  if (!firstOption) return null;

  const amount = toNumericPrice(firstOption.price);
  if (amount === null) return null;
  if (firstOption.priceType === 'FIXED') {
    return `\u20B9${amount.toLocaleString('en-IN')} Fixed`;
  }

  return formatPriceOptionPricingLabel({
    id: firstOption.id ?? '',
    title: firstOption.title ?? '',
    price: amount,
    priceType: firstOption.priceType ?? PRICE_TYPE.VISIT,
    priceComputationMode: firstOption.priceComputationMode ?? PRICE_COMPUTATION_MODE.FLAT,
  });
}

export function getPopularServicePriceTypePillLabel(service: CustomerHomeService): string | null {
  const firstOption = Array.isArray(service.priceOptions) ? service.priceOptions[0] : null;
  if (!firstOption?.priceType) return null;
  const label = formatPriceTypeLabel(firstOption.priceType);
  return label || null;
}

export function isCustomerHomeService(value: unknown): value is CustomerHomeService {
  if (!value || typeof value !== 'object') return false;
  const source = value as { id?: unknown; name?: unknown };
  return typeof source.id === 'string' && typeof source.name === 'string';
}

export function isCustomerHomeCategory(value: unknown): value is CustomerHomeCategory {
  if (!value || typeof value !== 'object') return false;
  const source = value as { id?: unknown; name?: unknown };
  return typeof source.id === 'string' && typeof source.name === 'string';
}
