import { titleCase } from '@/utils/text';

const PRICE_TYPE = {
  VISIT: 'VISIT',
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
  PER_UNIT: 'PER_UNIT',
  FIXED: 'FIXED',
} as const;

const PRICE_COMPUTATION_MODE = {
  FLAT: 'FLAT',
  PER_BLOCK: 'PER_BLOCK',
  PER_MINUTE: 'PER_MINUTE',
} as const;

export function getPriceRowTitle(priceType?: string | null, computationMode?: string | null): string {
  const normalizedType = typeof priceType === 'string' ? priceType.trim().toUpperCase() : '';
  const normalizedMode = typeof computationMode === 'string' ? computationMode.trim().toUpperCase() : '';

  if (normalizedType === PRICE_TYPE.VISIT) {
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_BLOCK) return 'Visit Fee per Block';
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_MINUTE) return 'Visit Fee per Minute';
    return 'Visit Fee';
  }
  if (normalizedType === PRICE_TYPE.HOURLY) {
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_BLOCK) return 'Hourly Rate / Price per Block';
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_MINUTE) return 'Price per Minute';
    return 'Fixed Labor Fee';
  }
  if (normalizedType === PRICE_TYPE.DAILY) {
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_BLOCK) return 'Daily Price per Block';
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_MINUTE) return 'Daily Price per Minute';
    return 'Daily Fee';
  }
  if (normalizedType === PRICE_TYPE.PER_UNIT) {
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_BLOCK) return 'Price per Unit per Block';
    if (normalizedMode === PRICE_COMPUTATION_MODE.PER_MINUTE) return 'Price per Unit per Minute';
    return 'Price per Unit';
  }
  return `Price ${titleCase(normalizedType || 'Fixed')}`;
}
