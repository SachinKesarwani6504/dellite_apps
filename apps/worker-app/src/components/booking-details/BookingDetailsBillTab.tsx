import { BookingBillSummaryCard } from '@/components/booking-details/BookingBillSummaryCard';
import type { BookingDetailsBooking } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { resolveBookingBillAmounts } from '@/utils/booking-details';

type BookingDetailsBillTabProps = {
  booking: BookingDetailsBooking;
};

export function BookingDetailsBillTab({ booking }: BookingDetailsBillTabProps) {
  return (
    <BookingBillSummaryCard
      title={APP_TEXT.jobs.billSummaryTitle}
      amounts={resolveBookingBillAmounts(booking)}
    />
  );
}
