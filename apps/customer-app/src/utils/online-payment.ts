import { getBookingPaymentInfo, isBookingPaymentSuccessful } from '@/utils/booking-details';
import type { BookingDetailsResponse } from '@/types/booking-details';
import type { OnlinePaymentBlock } from '@/payments/types';

export function getBookingOnlinePaymentBlock(
  details: BookingDetailsResponse | null | undefined,
): OnlinePaymentBlock | null {
  return details?.paymentInfo?.onlinePayment ?? null;
}

export function isBookingOnlinePaymentComplete(details: BookingDetailsResponse | null | undefined): boolean {
  if (!details) return false;

  const paymentInfo = details.paymentInfo;
  if (paymentInfo?.gatewayPaymentStatus === 'SUCCESS') return true;

  const payment = getBookingPaymentInfo(details);
  const status = paymentInfo?.paymentStatus
    ?? paymentInfo?.status
    ?? payment?.paymentStatus
    ?? payment?.status;

  if (status === 'PAID') return true;

  return isBookingPaymentSuccessful(status);
}

export function hasOnlinePaymentSavings(onlinePayment: OnlinePaymentBlock | null): boolean {
  if (!onlinePayment) return false;
  const savings = Number(onlinePayment.savingsIfOnline);
  return Number.isFinite(savings) && savings > 0;
}

export function hasOnlinePaymentDiscountTotal(discountTotal: string | null | undefined): boolean {
  if (!discountTotal) return false;
  const value = Number(discountTotal);
  return Number.isFinite(value) && value > 0;
}

export function hasPositiveMoneyAmount(value: string | null | undefined): boolean {
  if (!value) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export type OnlinePaymentDisplaySnapshot = {
  offers: OnlinePaymentBlock['onlinePaymentOffers'];
  savingsIfOnline: string;
  onlinePaymentDiscountTotal: string;
};

export function resolveOnlinePaymentDisplaySnapshot(
  onlinePayment: OnlinePaymentBlock | null,
  cached: OnlinePaymentDisplaySnapshot | null,
): OnlinePaymentDisplaySnapshot {
  if (!onlinePayment) {
    return cached ?? { offers: [], savingsIfOnline: '0', onlinePaymentDiscountTotal: '0' };
  }

  const hasLiveOffers = onlinePayment.onlinePaymentOffers.length > 0;
  const hasLiveSavings = hasOnlinePaymentSavings(onlinePayment);
  const hasLiveDiscount = hasOnlinePaymentDiscountTotal(onlinePayment.onlinePaymentDiscountTotal);

  if (hasLiveOffers || hasLiveSavings || hasLiveDiscount) {
    return {
      offers: onlinePayment.onlinePaymentOffers,
      savingsIfOnline: onlinePayment.savingsIfOnline,
      onlinePaymentDiscountTotal: onlinePayment.onlinePaymentDiscountTotal,
    };
  }

  return cached ?? {
    offers: [],
    savingsIfOnline: onlinePayment.savingsIfOnline,
    onlinePaymentDiscountTotal: onlinePayment.onlinePaymentDiscountTotal,
  };
}

export type OnlinePaymentAmountDisplay = {
  onlinePayableAmount: string;
  currentPayableAmount: string;
  savingsAmount: string;
  hasReducedOnlinePrice: boolean;
};

export function resolveOnlinePaymentAmountDisplay(
  onlinePayment: OnlinePaymentBlock | null,
  snapshot?: Pick<OnlinePaymentDisplaySnapshot, 'savingsIfOnline' | 'onlinePaymentDiscountTotal'> | null,
): OnlinePaymentAmountDisplay {
  const onlinePayableAmount = onlinePayment?.onlinePayableAmount ?? '0';
  let currentPayableAmount = onlinePayment?.currentPayableAmount ?? onlinePayableAmount;
  const onlineValue = Number(onlinePayableAmount);
  let currentValue = Number(currentPayableAmount);
  const savingsFromApi = Number(snapshot?.savingsIfOnline ?? onlinePayment?.savingsIfOnline ?? '0');
  const discountFromApi = Number(snapshot?.onlinePaymentDiscountTotal ?? onlinePayment?.onlinePaymentDiscountTotal ?? '0');
  const computedSavings = currentValue > onlineValue ? currentValue - onlineValue : 0;
  const savingsValue = savingsFromApi > 0
    ? savingsFromApi
    : discountFromApi > 0
      ? discountFromApi
      : computedSavings;

  if (savingsValue > 0 && currentValue <= onlineValue) {
    currentValue = onlineValue + savingsValue;
    currentPayableAmount = currentValue.toFixed(2);
  }

  const hasReducedOnlinePrice = savingsValue > 0 || currentValue > onlineValue;

  return {
    onlinePayableAmount,
    currentPayableAmount,
    savingsAmount: savingsValue > 0 ? savingsValue.toFixed(2) : '0',
    hasReducedOnlinePrice,
  };
}

export function hasOnlinePaymentOffers(
  offers: OnlinePaymentBlock['onlinePaymentOffers'] | null | undefined,
): boolean {
  return Array.isArray(offers) && offers.length > 0;
}
