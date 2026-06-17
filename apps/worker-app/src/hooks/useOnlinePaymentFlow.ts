import { useCallback, useState } from 'react';
import { openPaymentCheckout } from '@/payments/checkoutService';
import { usePaymentRefresh } from '@/payments/usePaymentRefresh';
import type { OnlinePaymentFlowResult, OnlinePaymentFlowState, PaymentIntentResponse } from '@/payments/types';

type UseOnlinePaymentFlowArgs<T> = {
  createIntent: () => Promise<PaymentIntentResponse>;
  fetchState: () => Promise<T>;
  isPaymentDone: (data: T) => boolean;
  onSettled?: (result: Exclude<OnlinePaymentFlowResult, 'busy'>) => void | Promise<void>;
};

export function useOnlinePaymentFlow<T>({
  createIntent,
  fetchState,
  isPaymentDone,
  onSettled,
}: UseOnlinePaymentFlowArgs<T>) {
  const [flowState, setFlowState] = useState<OnlinePaymentFlowState>('idle');
  const pollPaymentState = usePaymentRefresh(fetchState, isPaymentDone);

  const isBusy = flowState === 'creating_intent'
    || flowState === 'checkout_open'
    || flowState === 'refreshing';

  const runPayment = useCallback(async (): Promise<OnlinePaymentFlowResult> => {
    if (isBusy) return 'busy';

    setFlowState('creating_intent');
    try {
      const intent = await createIntent();
      setFlowState('checkout_open');
      const checkoutResult = await openPaymentCheckout(intent);

      if (checkoutResult === 'cancelled') {
        setFlowState('cancelled');
        await onSettled?.('cancelled');
        return 'cancelled';
      }

      if (checkoutResult === 'failed') {
        setFlowState('failed');
        await onSettled?.('failed');
        return 'failed';
      }

      setFlowState('refreshing');
      const pollResult = await pollPaymentState();
      setFlowState(pollResult === 'done' ? 'done' : 'processing');
      await onSettled?.(pollResult);
      return pollResult;
    } catch {
      setFlowState('failed');
      await onSettled?.('failed');
      return 'failed';
    }
  }, [createIntent, isBusy, onSettled, pollPaymentState]);

  const resetFlow = useCallback(() => {
    setFlowState('idle');
  }, []);

  return {
    flowState,
    isBusy,
    runPayment,
    resetFlow,
  };
}
