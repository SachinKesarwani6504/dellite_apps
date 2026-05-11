import { titleCase } from '@/utils';
import { PriceType, PriceComputationMode } from '@/types/pricing.types';

export function getPriceRowTitle(priceType?: string | null, computationMode?: string | null): string {
  if (priceType === PriceType.VISIT) {
    if (computationMode === PriceComputationMode.PER_BLOCK) return 'Visit Fee per Block';
    if (computationMode === PriceComputationMode.PER_MINUTE) return 'Visit Fee per Minute';
    return 'Visit Fee';
  }
  if (priceType === PriceType.HOURLY) {
    if (computationMode === PriceComputationMode.PER_BLOCK) return 'Hourly Rate / Price per Block';
    if (computationMode === PriceComputationMode.PER_MINUTE) return 'Price per Minute';
    return 'Fixed Labor Fee';
  }
  if (priceType === PriceType.DAILY) {
    if (computationMode === PriceComputationMode.PER_BLOCK) return 'Daily Price per Block';
    if (computationMode === PriceComputationMode.PER_MINUTE) return 'Daily Price per Minute';
    return 'Daily Fee';
  }
  if (priceType === PriceType.PER_UNIT) {
    if (computationMode === PriceComputationMode.PER_BLOCK) return 'Price per Unit per Block';
    if (computationMode === PriceComputationMode.PER_MINUTE) return 'Price per Unit per Minute';
    return 'Price per Unit';
  }
  return `Price ${titleCase(priceType || 'Fixed')}`;
}