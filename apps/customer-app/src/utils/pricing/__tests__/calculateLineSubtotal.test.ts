import { calculateLineSubtotal } from '@/utils/pricing/calculateLineSubtotal';
import { PricingValidationError } from '@/utils/pricing/pricing.types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  assert(actual === expected, `${message}. expected=${String(expected)} actual=${String(actual)}`);
}

function expectPricingError(fn: () => unknown, expectedCode: PricingValidationError['code']) {
  try {
    fn();
    throw new Error(`Expected PricingValidationError(${expectedCode}) but no error was thrown.`);
  } catch (error) {
    assert(error instanceof PricingValidationError, 'Expected PricingValidationError instance.');
    const typedError = error as PricingValidationError;
    assertEqual(typedError.code, expectedCode, 'Unexpected error code');
  }
}

// FLAT + quantity
{
  const result = calculateLineSubtotal({
    price: 499,
    priceType: 'VISIT',
    priceComputationMode: 'FLAT',
    quantity: 3,
  });
  assertEqual(result.subtotal, 1497, 'FLAT subtotal should multiply by quantity');
}

// PER_MINUTE + hourly
{
  const result = calculateLineSubtotal({
    price: 7,
    priceType: 'HOURLY',
    priceComputationMode: 'PER_MINUTE',
    quantity: 2,
    durationMinutes: 45,
  });
  assertEqual(result.unitBase, 315, 'PER_MINUTE unit base mismatch');
  assertEqual(result.subtotal, 630, 'PER_MINUTE subtotal mismatch');
}

// PER_BLOCK + ceil
{
  const result = calculateLineSubtotal({
    price: 120,
    priceType: 'HOURLY',
    priceComputationMode: 'PER_BLOCK',
    quantity: 1,
    durationMinutes: 95,
    billingUnitMinutes: 60,
  });
  assertEqual(result.multiplier, 2, 'PER_BLOCK ceil multiplier mismatch');
  assertEqual(result.subtotal, 240, 'PER_BLOCK ceil subtotal mismatch');
}

// PER_BLOCK + custom rounding floor
{
  const result = calculateLineSubtotal({
    price: 120,
    priceType: 'HOURLY',
    priceComputationMode: 'PER_BLOCK',
    quantity: 1,
    durationMinutes: 95,
    billingUnitMinutes: 60,
    roundingMode: 'FLOOR',
  });
  assertEqual(result.multiplier, 1, 'PER_BLOCK floor multiplier mismatch');
  assertEqual(result.subtotal, 120, 'PER_BLOCK floor subtotal mismatch');
}

// min/max clamp behavior
{
  const result = calculateLineSubtotal({
    price: 10,
    priceType: 'HOURLY',
    priceComputationMode: 'PER_MINUTE',
    quantity: 1,
    durationMinutes: 10,
    minMinutes: 30,
    maxMinutes: 90,
  });
  assertEqual(result.effectiveMinutes, 30, 'Duration should clamp to minMinutes');
  assertEqual(result.subtotal, 300, 'Clamped subtotal mismatch');
}

// missing minutes fallback
{
  const result = calculateLineSubtotal({
    price: 10,
    priceType: 'HOURLY',
    priceComputationMode: 'PER_MINUTE',
    quantity: 1,
  });
  assertEqual(result.effectiveMinutes, 1, 'Fallback minutes should be 1');
  assertEqual(result.subtotal, 10, 'Fallback minutes subtotal mismatch');
}

// decimal price precision
{
  const result = calculateLineSubtotal({
    price: 99.99,
    priceType: 'PER_UNIT',
    priceComputationMode: 'FLAT',
    quantity: 3,
  });
  assertEqual(result.subtotal, 299.97, 'Decimal precision mismatch');
}

// invalid quantity/price throws
expectPricingError(
  () => calculateLineSubtotal({
    price: -1,
    priceType: 'VISIT',
    priceComputationMode: 'FLAT',
    quantity: 1,
  }),
  'INVALID_PRICE',
);

expectPricingError(
  () => calculateLineSubtotal({
    price: 10,
    priceType: 'VISIT',
    priceComputationMode: 'FLAT',
    quantity: 0,
  }),
  'INVALID_QUANTITY',
);
