import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { DeviceSessionRole, DeviceSessionUpsertPayload } from '@/types/auth';

function resolvePlatform(): DeviceSessionUpsertPayload['platform'] {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

const pendingFcmMemoryRef = {
  value: null as string | null,
};

function normalizeToken(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveDeviceName() {
  const candidates = [Device.deviceName, Device.modelName];
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  throw new Error('Unable to resolve real deviceName from runtime device metadata.');
}

export async function getStableDeviceId() {
  if (Platform.OS === 'android') {
    const androidId = normalizeToken(Application.getAndroidId());
    if (!androidId) {
      throw new Error('Unable to resolve Android deviceId from Application.getAndroidId().');
    }
    return androidId;
  }

  if (Platform.OS === 'ios') {
    const iosId = normalizeToken(await Application.getIosIdForVendorAsync());
    if (!iosId) {
      throw new Error('Unable to resolve iOS deviceId from Application.getIosIdForVendorAsync().');
    }
    return iosId;
  }

  throw new Error(`Unsupported platform "${Platform.OS}" for device session registration.`);
}

export async function setPendingFcmToken(token: string | null | undefined) {
  pendingFcmMemoryRef.value = normalizeToken(token);
}

export async function getPendingFcmToken() {
  return pendingFcmMemoryRef.value;
}

export async function syncPendingFcmTokenFromDevice() {
  const permissions = await Notifications.getPermissionsAsync();
  const isGranted = Boolean((permissions as { granted?: boolean }).granted);
  if (!isGranted) {
    return null;
  }

  const pushToken = await Notifications.getDevicePushTokenAsync();
  const token = normalizeToken(pushToken.data);
  await setPendingFcmToken(token);
  return token;
}

export function registerFcmTokenRefreshListener(onToken: (token: string) => void) {
  const subscription = Notifications.addPushTokenListener(async (updatedToken) => {
    const token = normalizeToken(updatedToken.data);
    await setPendingFcmToken(token);
    if (token) {
      onToken(token);
    }
  });

  return () => {
    subscription.remove();
  };
}

export async function buildDeviceSessionPayload(role: DeviceSessionRole): Promise<DeviceSessionUpsertPayload> {
  const [deviceId, fcmToken] = await Promise.all([
    getStableDeviceId(),
    getPendingFcmToken(),
  ]);

  return {
    role,
    platform: resolvePlatform(),
    deviceId,
    deviceName: resolveDeviceName(),
    ...(fcmToken ? { fcmToken } : {}),
  };
}
