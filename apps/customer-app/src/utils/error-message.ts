function stripHtmlTags(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function looksLikeHtml(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('<!doctype')
    || normalized.startsWith('<html')
    || normalized.startsWith('<head')
    || normalized.startsWith('<body')
    || /<html[\s>]/i.test(value)
    || /<body[\s>]/i.test(value)
    || /<meta[\s>]/i.test(value)
    || /<script[\s>]/i.test(value)
    || /<div[\s>]/i.test(value);
}

export function sanitizeErrorMessage(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;

  const trimmedValue = value.trim();
  if (!trimmedValue) return fallback;
  if (looksLikeHtml(trimmedValue)) return fallback;

  const strippedValue = stripHtmlTags(trimmedValue);
  if (!strippedValue) return fallback;
  if (looksLikeHtml(strippedValue)) return fallback;

  return strippedValue.length > 240
    ? fallback
    : strippedValue;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message, fallback);
  }

  return fallback;
}
