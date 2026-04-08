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

export * from '@/utils/date';
