import { BOOKINGS_SCREEN, HOME_SCREEN, ONBOARDING_SCREEN, ROOT_SCREEN } from '@/types/screen-names';
import type { UserLiveEvent } from '@/types/live-notifications';
import { navigateSafely } from '@/navigation/navigationRef';

function getString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getEventData(event: UserLiveEvent) {
  return event.data && typeof event.data === 'object' ? event.data : {};
}

export function handleLiveEventNavigation(event: UserLiveEvent, eventId: string) {
  const data = getEventData(event);

  if (event.type === 'BOOKING') {
    const bookingId = getString(data.bookingId) ?? getString(data.booking_id);
    if (!bookingId) {
      return;
    }

    navigateSafely(ROOT_SCREEN.BOOKING_DETAILS_NAVIGATOR, {
      screen: BOOKINGS_SCREEN.DETAILS,
      params: {
        bookingId,
        notificationId: eventId,
        eventId,
      },
    });
    return;
  }

  if (event.type === 'PAYMENT' && event.event === 'PAYMENT_RECEIVED') {
    const bookingId = getString(data.bookingId) ?? getString(data.booking_id);
    if (!bookingId) {
      return;
    }

    navigateSafely(ROOT_SCREEN.BOOKING_DETAILS_NAVIGATOR, {
      screen: BOOKINGS_SCREEN.DETAILS,
      params: {
        bookingId,
        notificationId: eventId,
        eventId,
      },
    });
    return;
  }

  if (event.type === 'ONBOARDING') {
    const targetScreen = getString(data.screen);
    if (!targetScreen) {
      return;
    }

    navigateSafely(ROOT_SCREEN.ONBOARDING_NAVIGATOR, {
      screen: targetScreen,
      params: {
        notificationId: eventId,
        eventId,
      },
    });
    return;
  }

  if (event.type === 'SYSTEM') {
    const targetScreen = getString(data.screen);
    if (!targetScreen) {
      return;
    }

    navigateSafely(targetScreen, {
      ...(data || {}),
      notificationId: eventId,
      eventId,
    });
    return;
  }

  const targetScreen = getString(data.screen);
  if (targetScreen) {
    navigateSafely(targetScreen, {
      ...(data || {}),
      notificationId: eventId,
      eventId,
    });
  }
}
