import type { BookingConfirmationNavigation } from '@/types/main-screens';

export function returnToHomeAfterBookingCreate(navigation: BookingConfirmationNavigation) {
  navigation.popToTop();
  navigation.getParent()?.goBack();
}
