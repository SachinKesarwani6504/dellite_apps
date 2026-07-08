export function formatAverageRating(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value.toFixed(1);
}
