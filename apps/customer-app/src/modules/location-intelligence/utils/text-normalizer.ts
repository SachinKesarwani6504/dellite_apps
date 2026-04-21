export function toNullableTrimmed(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeToken(value: string | null | undefined): string {
  const trimmed = toNullableTrimmed(value);
  if (!trimmed) return '';
  return trimmed
    .normalize('NFKD')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export function toTitleCase(value: string | null | undefined): string {
  const normalized = toNullableTrimmed(value);
  if (!normalized) return '';
  return normalized
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
