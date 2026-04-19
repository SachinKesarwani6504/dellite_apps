export function humanizeEnumLabel(value?: string, fallback = 'Unknown') {
  if (!value || !value.trim()) return fallback;
  return value
    .trim()
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0)}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

export function safeImageUrl(url?: string | null) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed;
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

export function titleCase(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function toIconBadgeText(name?: string, iconText?: string) {
  if (iconText?.trim()) return iconText.trim();
  if (name?.trim()) return name.trim().charAt(0).toUpperCase();
  return '?';
}
