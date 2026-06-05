import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { DeviceSessionRole, DeviceSessionUpsertPayload } from '@/types/auth';
import { getPendingPushToken } from '@/lib/permission';

function resolvePlatform(): DeviceSessionUpsertPayload['platform'] {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

function logDeviceSession(step: string, payload?: Record<string, unknown>) {
  if (!__DEV__) return;
  // Push token values stay private; logs only expose presence and length.
  // eslint-disable-next-line no-console
  console.log(`[worker-device-session] ${step}`, payload ?? {});
}

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

export async function buildDeviceSessionPayload(role: DeviceSessionRole): Promise<DeviceSessionUpsertPayload> {
  logDeviceSession('build-payload-start', { role });

  const [deviceId, pushToken] = await Promise.all([
    getStableDeviceId(),
    getPendingPushToken(),
  ]);

  const platform = resolvePlatform();
  const deviceName = resolveDeviceName();
  logDeviceSession('build-payload-complete', {
    role,
    platform,
    hasDeviceId: Boolean(deviceId),
    deviceIdLength: deviceId.length,
    deviceName,
    hasPushToken: Boolean(pushToken),
    pushTokenLength: pushToken?.length ?? 0,
  });

  return {
    role,
    platform,
    deviceId,
    deviceName,
    fcmToken: pushToken,
  };
}
