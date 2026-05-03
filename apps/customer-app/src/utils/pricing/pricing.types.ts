export type PricingPriceType = 'VISIT' | 'HOURLY' | 'DAILY' | 'PER_UNIT';

export type PricingComputationMode = 'FLAT' | 'PER_MINUTE' | 'PER_BLOCK';

export type PricingRoundingMode = 'CEIL' | 'FLOOR' | 'ROUND';

export type CalculateLineSubtotalInput = {
  price: number;
  priceType: PricingPriceType;
  priceComputationMode: PricingComputationMode;
  quantity: number;
  durationMinutes?: number | null;
  billingUnitMinutes?: number | null;
  estimatedMinutes?: number | null;
  minMinutes?: number | null;
  maxMinutes?: number | null;
  roundingMode?: PricingRoundingMode | null;
};

export type CalculateLineSubtotalResult = {
  unitBase: number;
  effectiveMinutes: number;
  multiplier: number;
  subtotal: number;
  formula: string;
};

export type PricingValidationCode =
  | 'INVALID_PRICE'
  | 'INVALID_QUANTITY'
  | 'INVALID_BILLING_UNIT'
  | 'INVALID_DURATION_RANGE';

export class PricingValidationError extends Error {
  readonly code: PricingValidationCode;

  constructor(code: PricingValidationCode, message: string) {
    super(message);
    this.name = 'PricingValidationError';
    this.code = code;
  }
}
