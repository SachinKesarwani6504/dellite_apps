import RazorpayCheckout from 'react-native-razorpay';
import { buildRazorpayOpenOptions } from '@/payments/razorpayCheckoutMapper';
import type { PaymentIntentResponse } from '@/payments/types';

export { buildRazorpayOpenOptions } from '@/payments/razorpayCheckoutMapper';

export async function openPaymentCheckout(
  intent: PaymentIntentResponse,
): Promise<'success' | 'failed' | 'cancelled'> {
  if (intent.provider === 'RAZORPAY' && intent.checkout.razorpay) {
    try {
      await RazorpayCheckout.open(buildRazorpayOpenOptions(intent.checkout.razorpay));
      return 'success';
    } catch (error: unknown) {
      const razorpayError = error as { code?: number; description?: string };
      if (razorpayError?.code === 0 || razorpayError?.description === 'Payment cancelled') {
        return 'cancelled';
      }
      return 'failed';
    }
  }

  throw new Error(`${intent.provider} is not available in app yet`);
}
