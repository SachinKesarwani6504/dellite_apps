export type PaymentProvider = 'RAZORPAY' | 'PHONEPE';

export type RazorpayCheckout = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  prefill: { contact?: string | null; email?: string | null; name?: string | null };
};

export type PaymentIntentResponse = {
  paymentId: string;
  provider: PaymentProvider;
  amount: string;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  expiresAt: string;
  scope?: 'ALL_OPEN_DUES' | 'SETTLEMENT';
  settlementId?: string | null;
  checkout: { razorpay?: RazorpayCheckout; phonepe?: unknown };
};

export type OnlinePaymentActiveIntent = {
  paymentId: string;
  provider: string | null;
  status: string;
  expiresAt: string | null;
  amount: string;
};

export type OnlinePaymentOffer = {
  discountId: string;
  code: string;
  title: string;
  discountAmount: string;
  applicationStage: string;
};

export type OnlinePaymentBlock = {
  canPay: boolean;
  blockedReason: string | null;
  providers: PaymentProvider[];
  currentPayableAmount: string;
  onlinePayableAmount: string;
  onlinePaymentDiscountTotal: string;
  savingsIfOnline: string;
  onlinePaymentOffers: OnlinePaymentOffer[];
  activeIntent: OnlinePaymentActiveIntent | null;
};

export type OnlinePaymentFlowState =
  | 'idle'
  | 'creating_intent'
  | 'checkout_open'
  | 'refreshing'
  | 'done'
  | 'processing'
  | 'failed'
  | 'cancelled';

export type OnlinePaymentFlowResult =
  | 'done'
  | 'processing'
  | 'timeout'
  | 'cancelled'
  | 'failed'
  | 'busy';

export type RazorpayOpenOptions = {
  key: string;
  order_id: string;
  amount: string;
  currency: string;
  name: string;
  description: string;
  prefill: {
    contact?: string;
    email?: string;
    name?: string;
  };
  theme: { color: string };
};
