import type { PaymentProvider } from '@/payments/types';

export function isRazorpayProviderAvailable(providers: PaymentProvider[] | undefined): boolean {
  return Array.isArray(providers) && providers.includes('RAZORPAY');
}

export function getPrimaryPaymentProvider(providers: PaymentProvider[] | undefined): PaymentProvider | null {
  if (isRazorpayProviderAvailable(providers)) return 'RAZORPAY';
  if (Array.isArray(providers) && providers.includes('PHONEPE')) return 'PHONEPE';
  return null;
}
