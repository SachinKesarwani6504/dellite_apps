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
