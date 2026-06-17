import assert from 'node:assert/strict';
import type { SettlementPayoutInvoice } from '../types/worker-finance';
import {
  getSettlementPayoutProofReference,
  hasNonZeroFinanceAmount,
} from './worker-finance';

function buildInvoice(overrides: Partial<SettlementPayoutInvoice> = {}): SettlementPayoutInvoice {
  return {
    payoutId: 'payout-1',
    payoutCode: 'PO-001',
    status: 'PAID',
    blockedReason: null,
    provider: 'razorpayx',
    method: 'UPI',
    maskedDestination: 'sa***@upi',
    grossAmount: '700.00',
    commissionAdjustedAmount: '90.00',
    payoutAmount: '610.00',
    paidAt: '2026-06-28T10:30:00.000Z',
    providerPayoutId: 'pout_abc123',
    providerReference: 'REF-999',
    utr: 'UTR123456789',
    failureReason: null,
    items: [],
    ...overrides,
  };
}

assert.equal(getSettlementPayoutProofReference(buildInvoice()), 'UTR123456789');
assert.equal(
  getSettlementPayoutProofReference(buildInvoice({ utr: null, providerReference: 'REF-999' })),
  'REF-999',
);
assert.equal(
  getSettlementPayoutProofReference(buildInvoice({ utr: null, providerReference: null })),
  null,
);

assert.equal(hasNonZeroFinanceAmount('0.00'), false);
assert.equal(hasNonZeroFinanceAmount('90.00'), true);

console.log('worker-finance payout tests passed');
