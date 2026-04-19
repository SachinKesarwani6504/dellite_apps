import React, { createContext, useContext } from 'react';
import { useBookingFlowController } from '@/hooks/useBookingFlowController';
import type { BookingFlowContextType } from '@/types/booking-flow-context';

const BookingFlowContext = createContext<BookingFlowContextType | undefined>(undefined);

export function BookingFlowProvider({ children }: { children: React.ReactNode }) {
  const value = useBookingFlowController();
  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>;
}

export function useBookingFlowContext() {
  const context = useContext(BookingFlowContext);
  if (!context) {
    throw new Error('useBookingFlowContext must be used inside BookingFlowProvider');
  }
  return context;
}
