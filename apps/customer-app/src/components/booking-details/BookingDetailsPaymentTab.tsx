import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';

import { BookingOnlinePaymentSheet } from '@/components/booking-details/BookingOnlinePaymentSheet';
import { BookingPaymentDetailsCard } from '@/components/booking-details/BookingPaymentDetailsCard';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { useBottomSheetContext } from '@/contexts/BottomSheetContext';
import { useOnlinePaymentFlow } from '@/hooks/useOnlinePaymentFlow';
import { createBookingPaymentIntent, fetchBookingPaymentState } from '@/payments/api';
import { isRazorpayProviderAvailable } from '@/payments/paymentProvider';
import type { PaymentProvider } from '@/payments/types';
import type { BookingDetailsPaymentTabProps } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { canCustomerAddTip, getCustomerPaymentCopy, getCustomerPaymentStatus } from '@/utils/booking-actions';
import {
  getBookingPaymentInfo,
  hasBookingMoneyAmount,
} from '@/utils/booking-details';
import {
  getBookingOnlinePaymentBlock,
  isBookingOnlinePaymentComplete,
  resolveOnlinePaymentAmountDisplay,
  resolveOnlinePaymentDisplaySnapshot,
  type OnlinePaymentDisplaySnapshot,
} from '@/utils/online-payment';
import { showToast } from '@/utils/toast';

function resolveOnlinePaymentSheetSnapPoint(offerCount: number): string {
  if (offerCount > 2) return '68%';
  if (offerCount > 0) return '64%';
  return '58%';
}

export function BookingDetailsPaymentTab({ onAddTip, onRemoveTip }: BookingDetailsPaymentTabProps) {
  const { details, refresh } = useBookingDetailsContext();
  const { showCustomSheet } = useBottomSheetContext();
  const paymentStatus = getCustomerPaymentStatus(details);
  const payment = getBookingPaymentInfo(details);
  const tipAmount = payment?.tipAmount ?? null;
  const hasTip = hasBookingMoneyAmount(tipAmount);
  const canShowAddTip = Boolean(onAddTip) && canCustomerAddTip(details);
  const paymentCopy = getCustomerPaymentCopy(paymentStatus);
  const bookingId = details?.booking.id ?? '';
  const onlinePayment = getBookingOnlinePaymentBlock(details);
  const couponCodeRef = useRef<string | undefined>(undefined);
  const providerRef = useRef<PaymentProvider>('RAZORPAY');
  const onlinePaymentDisplayRef = useRef<OnlinePaymentDisplaySnapshot | null>(null);

  const { flowState, isBusy, runPayment, resetFlow } = useOnlinePaymentFlow({
    createIntent: () => createBookingPaymentIntent(bookingId, {
      provider: providerRef.current,
      couponCode: couponCodeRef.current,
    }),
    fetchState: () => fetchBookingPaymentState(bookingId),
    isPaymentDone: isBookingOnlinePaymentComplete,
    onSettled: async (result) => {
      await refresh();
      if (result === 'processing') {
        showToast('info', APP_TEXT.main.bookings.paymentOnlineProcessing);
      }
      if (result === 'cancelled') {
        showToast('info', APP_TEXT.main.bookings.paymentOnlineCancelled);
      }
      if (result === 'failed') {
        showToast('error', APP_TEXT.main.bookings.paymentOnlineFailed);
      }
      if (result === 'cancelled' || result === 'failed') {
        resetFlow();
      }
    },
  });

  const displaySnapshot = resolveOnlinePaymentDisplaySnapshot(onlinePayment, onlinePaymentDisplayRef.current);

  const openPaymentSheet = useCallback((couponCode?: string) => {
    if (!onlinePayment || isBusy) return;

    couponCodeRef.current = couponCode;
    const sheetAmounts = resolveOnlinePaymentAmountDisplay(onlinePayment, displaySnapshot);

    showCustomSheet({
      title: APP_TEXT.main.bookings.paymentOnlineSheetTitle,
      snapPoint: resolveOnlinePaymentSheetSnapPoint(displaySnapshot.offers.length),
      renderContent: ({ closeSheet }) => (
        <BookingOnlinePaymentSheet
          onlinePayableAmount={sheetAmounts.onlinePayableAmount}
          currentPayableAmount={sheetAmounts.currentPayableAmount}
          savingsAmount={sheetAmounts.savingsAmount}
          offers={displaySnapshot.offers}
          initialCouponCode={couponCode}
          providers={onlinePayment.providers}
          onClose={closeSheet}
          onPay={async (method, selectedCoupon) => {
            if (method !== 'RAZORPAY' || isBusy) return 'busy';
            providerRef.current = method;
            couponCodeRef.current = selectedCoupon;
            return runPayment();
          }}
        />
      ),
    });
  }, [displaySnapshot, isBusy, onlinePayment, runPayment, showCustomSheet]);

  const showOnlinePayment = Boolean(
    onlinePayment
    && isRazorpayProviderAvailable(onlinePayment.providers)
    && !isBookingOnlinePaymentComplete(details)
    && onlinePayment.canPay,
  );

  useEffect(() => {
    onlinePaymentDisplayRef.current = displaySnapshot;
  }, [displaySnapshot]);

  if (!details) return null;

  if (!payment) {
    return (
      <ListEmptyState
        containerClassName="mt-5"
        title={APP_TEXT.main.bookings.paymentDetailsEmptyTitle}
        description={APP_TEXT.main.bookings.paymentDetailsEmptyDescription}
        icon="card-outline"
      />
    );
  }

  return (
    <View className="mt-5">
      <BookingPaymentDetailsCard
        paymentStatus={paymentStatus}
        payment={payment}
        statusCopy={paymentCopy}
        actions={{
          onlinePayment,
          showOnlinePayment,
          flowState,
          isBusy,
          onPayOnline: openPaymentSheet,
          canShowAddTip,
          hasTip,
          tipAmount,
          onAddTip,
          onRemoveTip,
          displayOffers: displaySnapshot.offers,
          displaySavingsIfOnline: displaySnapshot.savingsIfOnline,
          displayDiscountTotal: displaySnapshot.onlinePaymentDiscountTotal,
        }}
      />
    </View>
  );
}
