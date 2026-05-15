import { createContext, useContext } from 'react';
import { useBookingDetailsController } from '@/hooks/useBookingDetailsController';
import type { BookingDetailsContextValue, BookingDetailsProviderProps } from '@/types/booking-details';

const BookingDetailsContext = createContext<BookingDetailsContextValue | null>(null);

export function BookingDetailsProvider({
  children,
  bookingId,
  role,
}: BookingDetailsProviderProps) {
  const value = useBookingDetailsController({ bookingId, role });

  return (
    <BookingDetailsContext.Provider value={value}>
      {children}
    </BookingDetailsContext.Provider>
  );
}

export function useBookingDetailsContext() {
  const value = useContext(BookingDetailsContext);
  if (!value) {
    throw new Error('useBookingDetailsContext must be used within BookingDetailsProvider.');
  }
  return value;
}
