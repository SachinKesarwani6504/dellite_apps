import { Linking } from 'react-native';
import { JOB_STACK_SCREENS, MAIN_TAB_SCREENS, PROFILE_SCREENS, ROOT_SCREENS } from '@/types/screen-names';
import {
  WORKER_NOTIFICATION_SCREENS,
  type NotificationListItem,
  type NotificationNavigationPayload,
} from '@/types/notifications';
import type { NotificationAction, NotificationData, UserLiveEvent } from '@/types/live-notifications';
import { openWorkerMainTabs, openWorkerProtectedRoot } from '@/utils/protected-navigation';

const WORKER_ROLE = 'WORKER';
const ALLOWED_WORKER_SCREENS = new Set<string>(Object.values(WORKER_NOTIFICATION_SCREENS));

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
    targetId: getString(value.targetId) ?? getString(value.bookingId) ?? getString(value.jobId),
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

function openWorkerProfileHome() {
  openWorkerMainTabs({
    screen: MAIN_TAB_SCREENS.profile,
    initial: false,
    params: {
      screen: PROFILE_SCREENS.home,
    },
  });
}

function openWorkerNotifications() {
  openWorkerProfileDetails(PROFILE_SCREENS.notifications);
}

function openWorkerProfileDetails(screen: string) {
  openWorkerProtectedRoot(ROOT_SCREENS.profileDetailsNavigator, {
    screen,
  });
}

function openWorkerJobsHome() {
  openWorkerMainTabs({
    screen: MAIN_TAB_SCREENS.home,
    initial: false,
  });
}

function openWorkerJobDetails(targetId: string | undefined, notificationId: string | undefined) {
  if (!targetId) {
    openWorkerJobsHome();
    return;
  }

  openWorkerProtectedRoot(ROOT_SCREENS.jobDetailsNavigator, {
    screen: JOB_STACK_SCREENS.details,
    params: {
      jobId: targetId,
      notificationId,
      eventId: notificationId,
    },
  });
}

async function handleOpenLink(data: NotificationData | null | undefined) {
  const url = getString(data?.externalUrl);
  if (!url) {
    openWorkerProfileHome();
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    openWorkerProfileHome();
  }
}

export async function handleNotificationNavigation(source: NotificationSource) {
  const payload = normalizeNotificationPayload(source);
  const action = payload.action;
  const data = payload.data ?? null;

  if (data?.role && data.role !== WORKER_ROLE) {
    return;
  }

  if (action === 'OPEN_LINK') {
    await handleOpenLink(data);
    return;
  }

  if (action !== 'OPEN_SCREEN') {
    openWorkerProfileHome();
    return;
  }

  const screen = getString(data?.screen);
  if (!screen || !ALLOWED_WORKER_SCREENS.has(screen)) {
    openWorkerProfileHome();
    return;
  }

  switch (screen) {
    case WORKER_NOTIFICATION_SCREENS.JOB_DETAILS:
      openWorkerJobDetails(getString(data?.targetId), payload.notificationId);
      return;
    case WORKER_NOTIFICATION_SCREENS.EARNINGS:
      openWorkerMainTabs({ screen: MAIN_TAB_SCREENS.earnings });
      return;
    case WORKER_NOTIFICATION_SCREENS.PROFILE:
      openWorkerProfileHome();
      return;
    case WORKER_NOTIFICATION_SCREENS.NOTIFICATIONS:
      openWorkerProfileDetails(PROFILE_SCREENS.notifications);
      return;
    case WORKER_NOTIFICATION_SCREENS.EDIT_PROFILE:
      openWorkerProfileDetails(PROFILE_SCREENS.editProfile);
      return;
    case WORKER_NOTIFICATION_SCREENS.HELP_SUPPORT:
      openWorkerProfileDetails(PROFILE_SCREENS.helpSupport);
      return;
    case WORKER_NOTIFICATION_SCREENS.REFERRAL:
      openWorkerProfileDetails(PROFILE_SCREENS.referral);
      return;
    case WORKER_NOTIFICATION_SCREENS.ALL_SKILLS:
      openWorkerProfileDetails(PROFILE_SCREENS.allSkills);
      return;
    case WORKER_NOTIFICATION_SCREENS.AADHAAR_SCREEN:
      openWorkerProfileDetails(PROFILE_SCREENS.identityVerification);
      return;
    case WORKER_NOTIFICATION_SCREENS.BANK_ACCOUNT_INFO:
      openWorkerProfileDetails(PROFILE_SCREENS.payoutDetails);
      return;
    case WORKER_NOTIFICATION_SCREENS.CERTIFICATE_ADD_EDIT:
      openWorkerProfileDetails(PROFILE_SCREENS.certificateManager);
      return;
    case WORKER_NOTIFICATION_SCREENS.ADD_SKILL:
      openWorkerProfileDetails(PROFILE_SCREENS.skillManager);
      return;
    default:
      openWorkerProfileHome();
  }
}
