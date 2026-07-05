import assert from 'node:assert/strict';
import { buildRazorpayOpenOptions } from './razorpayCheckoutMapper';
import type { PaymentIntentResponse } from './types';

const sampleIntent: PaymentIntentResponse = {
  paymentId: 'payment-uuid',
  provider: 'RAZORPAY',
  amount: '93.00',
  currency: 'INR',
  status: 'PENDING',
  expiresAt: '2026-06-28T12:00:00.000Z',
  checkout: {
    razorpay: {
      keyId: 'rzp_test_xxx',
      orderId: 'order_xxx',
      amountPaise: 9300,
      currency: 'INR',
      name: 'Dellite',
      description: 'DLB-42',
      prefill: {
        contact: '98xxxxxx10',
        email: 'user@example.com',
        name: 'Rahul',
      },
    },
  },
};

const options = buildRazorpayOpenOptions(sampleIntent.checkout.razorpay!);

assert.equal(options.key, 'rzp_test_xxx');
assert.equal(options.order_id, 'order_xxx');
assert.equal(options.amount, '9300');
assert.equal(options.currency, 'INR');
assert.equal(options.name, 'Dellite');
assert.equal(options.description, 'DLB-42');
assert.equal(options.prefill.contact, '98xxxxxx10');
assert.equal(options.prefill.email, 'user@example.com');
assert.equal(options.prefill.name, 'Rahul');
assert.equal(options.theme.color, '#0F766E');

console.log('razorpayCheckoutMapper test passed');
