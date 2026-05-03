import type { CustomerHomeCategory, CustomerHomePayload, CustomerHomeService } from '@/types/customer';

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
  if (!value) return '';
  const trimmed = value.trim();
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
