import assert from 'node:assert/strict';
import { buildRazorpayOpenOptions } from './razorpayCheckoutMapper';
import type { PaymentIntentResponse } from './types';

const sampleIntent: PaymentIntentResponse = {
  paymentId: 'payment-uuid',
  provider: 'RAZORPAY',
  amount: '270.00',
  currency: 'INR',
  status: 'PENDING',
  expiresAt: '2026-06-28T12:00:00.000Z',
  scope: 'ALL_OPEN_DUES',
  checkout: {
    razorpay: {
      keyId: 'rzp_test_worker',
      orderId: 'order_worker',
      amountPaise: 27000,
      currency: 'INR',
      name: 'Dellite Partner',
      description: 'Commission due',
      prefill: {
        contact: null,
        email: null,
        name: null,
      },
    },
  },
};

const options = buildRazorpayOpenOptions(sampleIntent.checkout.razorpay!);

assert.equal(options.key, 'rzp_test_worker');
assert.equal(options.order_id, 'order_worker');
assert.equal(options.amount, '27000');
assert.equal(options.prefill.contact, undefined);

console.log('razorpayCheckoutMapper test passed');
