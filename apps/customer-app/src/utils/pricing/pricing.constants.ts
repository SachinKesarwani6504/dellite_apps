import type { PricingComputationMode, PricingRoundingMode } from '@/utils/pricing/pricing.types';

export const PRICING_COMPUTATION_MODE: Record<PricingComputationMode, PricingComputationMode> = {
  FLAT: 'FLAT',
  PER_MINUTE: 'PER_MINUTE',
  PER_BLOCK: 'PER_BLOCK',
};

export const PRICING_ROUNDING_MODE: Record<PricingRoundingMode, PricingRoundingMode> = {
  CEIL: 'CEIL',
  FLOOR: 'FLOOR',
  ROUND: 'ROUND',
};

export const DEFAULT_BILLING_UNIT_MINUTES = 60;
export const FALLBACK_EFFECTIVE_MINUTES = 1;
export const PAISE_IN_RUPEE = 100;
export const HOURLY_DURATION_CHIP_STEP_MINUTES = 15;
