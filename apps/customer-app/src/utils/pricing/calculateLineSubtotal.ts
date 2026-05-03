import {
  DEFAULT_BILLING_UNIT_MINUTES,
  FALLBACK_EFFECTIVE_MINUTES,
  PAISE_IN_RUPEE,
} from '@/utils/pricing/pricing.constants';
import type {
  CalculateLineSubtotalInput,
  CalculateLineSubtotalResult,
  PricingRoundingMode,
} from '@/utils/pricing/pricing.types';
import { PricingValidationError } from '@/utils/pricing/pricing.types';

function toFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

function asFiniteNumber(value: unknown, fallback: number): number {
  return toFiniteNumber(value) ? (value as number) : fallback;
}

function toPaise(rupees: number) {
  return Math.round(rupees * PAISE_IN_RUPEE);
}

function fromPaise(paise: number) {
  return Math.round(paise) / PAISE_IN_RUPEE;
}

function clampMinutes(minutes: number, minMinutes?: number | null, maxMinutes?: number | null) {
  let next = minutes;
  if (toFiniteNumber(minMinutes)) {
    next = Math.max(next, asFiniteNumber(minMinutes, next));
  }
  if (toFiniteNumber(maxMinutes)) {
    next = Math.min(next, asFiniteNumber(maxMinutes, next));
  }
  return next;
}

function resolveEffectiveMinutes(input: CalculateLineSubtotalInput) {
  const firstChoice = toFiniteNumber(input.durationMinutes)
    ? asFiniteNumber(input.durationMinutes, 0)
    : toFiniteNumber(input.estimatedMinutes)
      ? asFiniteNumber(input.estimatedMinutes, 0)
      : toFiniteNumber(input.minMinutes)
        ? asFiniteNumber(input.minMinutes, 0)
        : 0;

  return clampMinutes(firstChoice, input.minMinutes, input.maxMinutes);
}

function resolveMinutesForTimeMode(input: CalculateLineSubtotalInput, effectiveMinutes: number) {
  if (effectiveMinutes > 0) return effectiveMinutes;
  if (toFiniteNumber(input.minMinutes) && asFiniteNumber(input.minMinutes, 0) > 0) return asFiniteNumber(input.minMinutes, FALLBACK_EFFECTIVE_MINUTES);
  if (toFiniteNumber(input.estimatedMinutes) && asFiniteNumber(input.estimatedMinutes, 0) > 0) return asFiniteNumber(input.estimatedMinutes, FALLBACK_EFFECTIVE_MINUTES);
  return FALLBACK_EFFECTIVE_MINUTES;
}

function resolveRounding(value: number, roundingMode?: PricingRoundingMode | null) {
  const mode = roundingMode ?? 'CEIL';
  if (mode === 'FLOOR') return Math.floor(value);
  if (mode === 'ROUND') return Math.round(value);
  return Math.ceil(value);
}

function validateInput(input: CalculateLineSubtotalInput) {
  if (!toFiniteNumber(input.price) || input.price < 0) {
    throw new PricingValidationError('INVALID_PRICE', 'Price must be a finite number greater than or equal to 0.');
  }
  if (!toFiniteNumber(input.quantity) || input.quantity < 1) {
    throw new PricingValidationError('INVALID_QUANTITY', 'Quantity must be a finite number greater than or equal to 1.');
  }
  if (toFiniteNumber(input.billingUnitMinutes) && asFiniteNumber(input.billingUnitMinutes, 0) <= 0) {
    throw new PricingValidationError('INVALID_BILLING_UNIT', 'billingUnitMinutes must be greater than 0 when provided.');
  }
  if (toFiniteNumber(input.minMinutes) && toFiniteNumber(input.maxMinutes) && asFiniteNumber(input.minMinutes, 0) > asFiniteNumber(input.maxMinutes, 0)) {
    throw new PricingValidationError('INVALID_DURATION_RANGE', 'minMinutes cannot be greater than maxMinutes.');
  }
}

export function calculateLineSubtotal(input: CalculateLineSubtotalInput): CalculateLineSubtotalResult {
  validateInput(input);

  const quantity = Math.floor(asFiniteNumber(input.quantity, 1));
  const unitPricePaise = toPaise(input.price);
  const effectiveMinutes = resolveEffectiveMinutes(input);

  if (input.priceComputationMode === 'FLAT') {
    const subtotalPaise = unitPricePaise * quantity;
    return {
      unitBase: fromPaise(unitPricePaise),
      effectiveMinutes,
      multiplier: 1,
      subtotal: fromPaise(subtotalPaise),
      // PriceType currently uses same quantity multiplier; hook kept for future branching.
      formula: `flat ${fromPaise(unitPricePaise)} x qty ${quantity}`,
    };
  }

  if (input.priceComputationMode === 'PER_MINUTE') {
    const minutes = resolveMinutesForTimeMode(input, effectiveMinutes);
    const multiplier = asFiniteNumber(minutes, FALLBACK_EFFECTIVE_MINUTES);
    const unitBasePaise = unitPricePaise * multiplier;
    const subtotalPaise = unitBasePaise * quantity;
    return {
      unitBase: fromPaise(unitBasePaise),
      effectiveMinutes: minutes,
      multiplier,
      subtotal: fromPaise(subtotalPaise),
      formula: `${fromPaise(unitPricePaise)} x ${minutes} min x qty ${quantity}`,
    };
  }

  const minutes = resolveMinutesForTimeMode(input, effectiveMinutes);
  const blockMinutes = toFiniteNumber(input.billingUnitMinutes) ? asFiniteNumber(input.billingUnitMinutes, DEFAULT_BILLING_UNIT_MINUTES) : DEFAULT_BILLING_UNIT_MINUTES;
  const rawBlocks = asFiniteNumber(minutes, FALLBACK_EFFECTIVE_MINUTES) / blockMinutes;
  const roundedBlocks = Math.max(1, resolveRounding(rawBlocks, input.roundingMode));
  const unitBasePaise = unitPricePaise * roundedBlocks;
  const subtotalPaise = unitBasePaise * quantity;

  const roundingExpr = input.roundingMode?.toLowerCase() ?? 'ceil';
  return {
    unitBase: fromPaise(unitBasePaise),
    effectiveMinutes: minutes,
    multiplier: asFiniteNumber(roundedBlocks, 1),
    subtotal: fromPaise(subtotalPaise),
    formula: `${fromPaise(unitPricePaise)} x ${roundingExpr}(${minutes}/${blockMinutes}) x qty ${quantity}`,
  };
}
