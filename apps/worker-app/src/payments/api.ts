import { apiPost } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { PaymentIntentResponse, PaymentProvider } from '@/payments/types';

type CommissionPaymentIntentPayload = {
  provider: PaymentProvider;
  amount?: string;
};

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

export async function createAllCommissionDuesPaymentIntent(
  payload: CommissionPaymentIntentPayload,
): Promise<PaymentIntentResponse> {
  const response = await apiPost<
    ApiEnvelope<PaymentIntentResponse> | PaymentIntentResponse,
    CommissionPaymentIntentPayload
  >(
    '/worker/commission-dues/payment/intents',
    payload,
    {
      auth: true,
      tokenType: 'access',
      toast: {
        errorTitle: 'Payment unavailable',
      },
    },
  );

  return unwrapData(response);
}

export async function createSettlementCommissionPaymentIntent(
  settlementId: string,
  payload: CommissionPaymentIntentPayload,
): Promise<PaymentIntentResponse> {
  const normalizedSettlementId = settlementId.trim();
  if (!normalizedSettlementId) {
    throw new Error('Settlement id is required.');
  }

  const response = await apiPost<
    ApiEnvelope<PaymentIntentResponse> | PaymentIntentResponse,
    CommissionPaymentIntentPayload
  >(
    `/worker/earnings/settlements/${encodeURIComponent(normalizedSettlementId)}/commission-payment/intents`,
    payload,
    {
      auth: true,
      tokenType: 'access',
      toast: {
        errorTitle: 'Payment unavailable',
      },
    },
  );

  return unwrapData(response);
}
