import * as ExpoLocation from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { LocationPermissionStatus } from '@/modules/location/types/location.types';
import { setupNotificationChannels } from '@/utils/notification-channel';

const pendingPushTokenMemoryRef = {
  value: null as string | null,
};

function logPermission(step: string, payload?: Record<string, unknown>) {
  if (!__DEV__) return;
  // Push token values stay private; logs only expose presence and length.
  // eslint-disable-next-line no-console
  console.log(`[customer-permission] ${step}`, payload ?? {});
}

function normalizeToken(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toLocationPermissionStatus(status: ExpoLocation.PermissionStatus): LocationPermissionStatus {
  if (status === ExpoLocation.PermissionStatus.GRANTED) {
    return 'granted';
  }

  if (status === ExpoLocation.PermissionStatus.DENIED) {
    return 'denied';
  }

  return 'undetermined';
}

function resolveNotificationPermissionStatus(permission: Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>) {
  if (permission.granted) {
    return 'granted' as const;
  }

  if (permission.status === Notifications.PermissionStatus.DENIED) {
    return 'denied' as const;
  }

  return 'undetermined' as const;
}

export async function getLocationPermissionStatusFromDevice(): Promise<LocationPermissionStatus> {
  const permission = await ExpoLocation.getForegroundPermissionsAsync();
  const status = toLocationPermissionStatus(permission.status);
  logPermission('location-permission-current', { granted: status === 'granted', status });
  return status;
}

export async function requestLocationPermissionFromDevice(): Promise<LocationPermissionStatus> {
  const permission = await ExpoLocation.requestForegroundPermissionsAsync();
  const status = toLocationPermissionStatus(permission.status);
  logPermission('location-permission-requested', { granted: status === 'granted', status });
  return status;
}

export async function getNotificationPermissionStatusFromDevice() {
  const permission = await Notifications.getPermissionsAsync();
  const status = resolveNotificationPermissionStatus(permission);
  logPermission('notification-permission-current', {
    granted: status === 'granted',
    status,
  });
  return status;
}

export async function requestNotificationPermissionFromDevice() {
  logPermission('notification-permission-request-start', { platform: Platform.OS });
  await setupNotificationChannels();

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  const status = resolveNotificationPermissionStatus(requestedPermissions);
  logPermission('notification-permission-requested', {
    granted: status === 'granted',
    status,
  });
  return status;
}

export async function setPendingPushToken(token: string | null | undefined) {
  const normalizedToken = normalizeToken(token);
  const previousToken = pendingPushTokenMemoryRef.value;
  pendingPushTokenMemoryRef.value = normalizedToken;
  logPermission('set-pending-push-token', {
    hasToken: Boolean(normalizedToken),
    tokenLength: normalizedToken?.length ?? 0,
    changed: previousToken !== normalizedToken,
  });
  return {
    token: normalizedToken,
    changed: previousToken !== normalizedToken,
  };
}

export async function getPendingPushToken() {
  return pendingPushTokenMemoryRef.value;
}

export async function syncPendingPushTokenFromDevice() {
  logPermission('push-token-sync-start', { platform: Platform.OS });

  const permissionStatus = resolveNotificationPermissionStatus(await Notifications.getPermissionsAsync());
  logPermission('notification-permission-current', {
    granted: permissionStatus === 'granted',
    status: permissionStatus,
  });

  const shouldSkipTokenFetch = permissionStatus !== 'granted' && Platform.OS !== 'android';
  if (shouldSkipTokenFetch) {
    logPermission('push-token-sync-skipped-permission-denied');
    return null;
  }

  if (permissionStatus !== 'granted') {
    logPermission('push-token-sync-attempt-without-notification-permission', {
      platform: Platform.OS,
      status: permissionStatus,
    });
  }

  try {
    const pushToken = await Notifications.getDevicePushTokenAsync();
    const token = normalizeToken(pushToken.data);
    await setPendingPushToken(token);
    logPermission('push-token-sync-complete', {
      hasToken: Boolean(token),
      tokenLength: token?.length ?? 0,
    });
    return token;
  } catch (error) {
    logPermission('push-token-sync-failed', {
      platform: Platform.OS,
      status: permissionStatus,
      message: error instanceof Error ? error.message : 'Unknown push token error',
    });
    return null;
  }
}

export function registerPushTokenRefreshListener(onToken: (token: string) => void) {
  const subscription = Notifications.addPushTokenListener(async (updatedToken) => {
    const token = normalizeToken(updatedToken.data);
    const result = await setPendingPushToken(token);
    logPermission('push-token-refresh', {
      hasToken: Boolean(token),
      tokenLength: token?.length ?? 0,
      changed: result.changed,
    });
    if (token && result.changed) {
      onToken(token);
    }
  });

  return () => {
    subscription.remove();
  };
}
