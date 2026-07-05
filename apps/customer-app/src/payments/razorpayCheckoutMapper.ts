import type { RazorpayCheckout as RazorpayCheckoutPayload, RazorpayOpenOptions } from '@/payments/types';

const RAZORPAY_THEME_COLOR = '#0F766E';

export function buildRazorpayOpenOptions(checkout: RazorpayCheckoutPayload): RazorpayOpenOptions {
  return {
    key: checkout.keyId,
    order_id: checkout.orderId,
    amount: String(checkout.amountPaise),
    currency: checkout.currency,
    name: checkout.name,
    description: checkout.description,
    prefill: {
      contact: checkout.prefill.contact ?? undefined,
      email: checkout.prefill.email ?? undefined,
      name: checkout.prefill.name ?? undefined,
    },
    theme: { color: RAZORPAY_THEME_COLOR },
  };
}
