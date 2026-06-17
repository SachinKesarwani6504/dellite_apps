import { Linking } from 'react-native';
import { MAIN_TAB_SCREEN, PROFILE_SCREEN, ROOT_SCREEN, BOOKINGS_SCREEN } from '@/types/screen-names';
import {
  CUSTOMER_NOTIFICATION_SCREENS,
  type NotificationListItem,
  type NotificationNavigationPayload,
} from '@/types/notifications';
import type { NotificationAction, NotificationData, UserLiveEvent } from '@/types/live-notifications';
import { openCustomerMainTabs, openCustomerProtectedRoot } from '@/utils/protected-navigation';

const CUSTOMER_ROLE = 'CUSTOMER';
const ALLOWED_CUSTOMER_SCREENS = new Set<string>(Object.values(CUSTOMER_NOTIFICATION_SCREENS));

type NotificationSource =
  | NotificationListItem
  | UserLiveEvent
  | { notification?: { request?: { content?: { title?: string | null; body?: string | null; data?: Record<string, unknown> | null } } } }
  | { data?: Record<string, unknown> | null; title?: string | null; body?: string | null; notification?: { title?: string | null; body?: string | null } }
  | NotificationNavigationPayload;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isNotificationAction(value: unknown): value is NotificationAction {
  return value === 'NONE' || value === 'OPEN_SCREEN' || value === 'OPEN_LINK';
}

function normalizeNotificationData(value: unknown): NotificationData | null {
  if (!isRecord(value)) return null;

  return {
    screen: getString(value.screen),
    targetId: getString(value.targetId) ?? getString(value.bookingId),
    role: value.role === 'CUSTOMER' || value.role === 'WORKER' ? value.role : undefined,
    externalUrl: getString(value.externalUrl),
    imageUrl: getString(value.imageUrl),
    title: getString(value.title),
    message: getString(value.message),
    bookingId: getString(value.bookingId),
    bookingCode: getString(value.bookingCode),
    serviceName: getString(value.serviceName),
    amount: getString(value.amount),
  };
}

function getFcmData(source: NotificationSource) {
  const record = isRecord(source) ? (source as Record<string, unknown>) : null;
  const notification = record && isRecord(record.notification) ? (record.notification as Record<string, unknown>) : null;
  const request = notification && isRecord(notification.request) ? (notification.request as Record<string, unknown>) : null;
  const content = request && isRecord(request.content) ? (request.content as Record<string, unknown>) : null;

  if (content) {
    return content;
  }

  if (record && isRecord(record.data)) {
    const embeddedNotification = isRecord(record.notification) ? (record.notification as Record<string, unknown>) : null;
    return {
      data: record.data,
      title: getString(record.title) ?? getString(embeddedNotification?.title),
      body: getString(record.body) ?? getString(embeddedNotification?.body),
    };
  }

  return null;
}

export function normalizeNotificationPayload(source: NotificationSource): NotificationNavigationPayload {
  if ('id' in (source as NotificationListItem)) {
    const item = source as NotificationListItem;
    return {
      notificationId: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      event: item.event,
      action: item.action ?? undefined,
      data: item.data ?? null,
    };
  }

  if ('eventId' in (source as UserLiveEvent) || 'type' in (source as UserLiveEvent)) {
    const event = source as UserLiveEvent;
    return {
      notificationId: getString(event.eventId),
      title: normalizeNotificationData(event.data)?.title ?? getString(event.title),
      message: normalizeNotificationData(event.data)?.message ?? getString(event.message),
      type: event.type,
      event: event.event,
      action: isNotificationAction(event.action) ? event.action : undefined,
      data: normalizeNotificationData(event.data),
    };
  }

  const fcm = getFcmData(source);
  if (fcm) {
    const rawData = isRecord(fcm.data) ? fcm.data : {};
    return {
      notificationId: getString(rawData.notificationId) ?? getString(rawData.eventId),
      title: getString(fcm.title) ?? getString(rawData.title),
      message: getString(fcm.body) ?? getString(rawData.message),
      type: getString(rawData.type) as NotificationNavigationPayload['type'],
      event: getString(rawData.event) as NotificationNavigationPayload['event'],
      action: isNotificationAction(rawData.action) ? rawData.action : undefined,
      data: normalizeNotificationData({
        screen: rawData.screen,
        targetId: rawData.targetId,
        role: rawData.role,
        externalUrl: rawData.externalUrl,
      }),
    };
  }

  return source as NotificationNavigationPayload;
}

function openCustomerBookingsList() {
  openCustomerMainTabs({
    screen: MAIN_TAB_SCREEN.PROFILE,
    initial: false,
  });
  openCustomerProfileDetails(PROFILE_SCREEN.BOOKINGS);
}

function openCustomerProfileHome() {
  openCustomerMainTabs({
    screen: MAIN_TAB_SCREEN.PROFILE,
    initial: false,
    params: {
      screen: PROFILE_SCREEN.PROFILE_HOME,
    },
  });
}

function openCustomerNotifications() {
  openCustomerProfileDetails(PROFILE_SCREEN.NOTIFICATIONS);
}

function openCustomerProfileDetails(screen: string) {
  openCustomerProtectedRoot(ROOT_SCREEN.PROFILE_DETAILS_NAVIGATOR, {
    screen,
  });
}

function openCustomerBookingDetails(targetId: string | undefined, notificationId: string | undefined) {
  if (!targetId) {
    openCustomerBookingsList();
    return;
  }

  openCustomerProtectedRoot(ROOT_SCREEN.BOOKING_DETAILS_NAVIGATOR, {
    screen: BOOKINGS_SCREEN.DETAILS,
    params: {
      bookingId: targetId,
      notificationId,
      eventId: notificationId,
    },
  });
}

async function handleOpenLink(data: NotificationData | null | undefined) {
  const url = getString(data?.externalUrl);
  if (!url) {
    openCustomerNotifications();
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    openCustomerNotifications();
  }
}

export async function handleNotificationNavigation(source: NotificationSource) {
  const payload = normalizeNotificationPayload(source);
  const action = payload.action;
  const data = payload.data ?? null;

  if (data?.role && data.role !== CUSTOMER_ROLE) {
    return;
  }

  if (action === 'OPEN_LINK') {
    await handleOpenLink(data);
    return;
  }

  if (action !== 'OPEN_SCREEN') {
    openCustomerNotifications();
    return;
  }

  const screen = getString(data?.screen);
  if (!screen || !ALLOWED_CUSTOMER_SCREENS.has(screen)) {
    openCustomerNotifications();
    return;
  }

  switch (screen) {
    case CUSTOMER_NOTIFICATION_SCREENS.BOOKINGS:
      openCustomerBookingsList();
      return;
    case CUSTOMER_NOTIFICATION_SCREENS.BOOKING_DETAILS:
      openCustomerBookingDetails(getString(data?.targetId), payload.notificationId);
      return;
    case CUSTOMER_NOTIFICATION_SCREENS.PROFILE:
      openCustomerProfileHome();
      return;
    case CUSTOMER_NOTIFICATION_SCREENS.EDIT_PROFILE:
      openCustomerProfileDetails(PROFILE_SCREEN.EDIT_PROFILE);
      return;
    case CUSTOMER_NOTIFICATION_SCREENS.REFERRAL:
      openCustomerProfileDetails(PROFILE_SCREEN.REFERRAL);
      return;
    case CUSTOMER_NOTIFICATION_SCREENS.NOTIFICATIONS:
    default:
      openCustomerNotifications();
  }
}
