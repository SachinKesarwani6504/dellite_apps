import { JOB_STACK_SCREENS, ROOT_SCREENS } from '@/types/screen-names';
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

  if (event.type === 'JOB' || event.event === 'JOB_INVITE') {
    const jobId = getString(data.jobId)
      ?? getString(data.job_id)
      ?? getString(data.bookingId)
      ?? getString(data.booking_id);
    if (!jobId) {
      return;
    }

    navigateSafely(ROOT_SCREENS.jobDetailsNavigator, {
      screen: JOB_STACK_SCREENS.details,
      params: {
        jobId,
        inviteStatus: getString(data.inviteStatus) ?? undefined,
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
