const ADMINISTRATIVE_CITY_WORDS = new Set([
  'DIVISION',
  'DISTRICT',
  'REGION',
  'ZONE',
  'CIRCLE',
  'MANDAL',
  'TEHSIL',
  'TALUKA',
  'BLOCK',
  'COMMISSIONERATE',
]);

export function normalizeCityName(value: string): string;
export function normalizeCityName(value: string | null | undefined): string;
export function normalizeCityName(value: string | null | undefined): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(part => !ADMINISTRATIVE_CITY_WORDS.has(part.toUpperCase()))
    .join(' ')
    .trim();
}

