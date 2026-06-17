import { View } from 'react-native';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { BookingBillSummaryCard } from '@/components/booking-details/BookingBillSummaryCard';
import { APP_TEXT } from '@/utils/appText';
import { getCustomerPaymentStatus } from '@/utils/booking-actions';
import { isBookingPaymentSuccessful, resolveBookingBillAmounts } from '@/utils/booking-details';

export function BookingDetailsBillTab() {
  const { details } = useBookingDetailsContext();
  if (!details) return null;

  const paymentStatus = getCustomerPaymentStatus(details);
  const isPaymentComplete = isBookingPaymentSuccessful(paymentStatus);

  return (
    <View className="mt-5">
      <BookingBillSummaryCard
        title={APP_TEXT.main.bookingFlow.billSummaryTitle}
        amounts={resolveBookingBillAmounts(details.booking)}
        isPaymentComplete={isPaymentComplete}
      />
    </View>
  );
}
