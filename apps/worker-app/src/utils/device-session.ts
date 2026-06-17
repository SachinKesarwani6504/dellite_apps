import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  getPendingPushToken,
  registerPushTokenRefreshListener,
  setPendingPushToken,
  syncPendingPushTokenFromDevice,
} from '@/lib/permission';
import type { DeviceSessionRole, DeviceSessionUpsertPayload } from '@/types/auth';
import { getSecureValue, removeSecureValue, saveSecureValue } from '@/utils/key-chain-storage/key-chain-service';
import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';

const legacyDeviceKeyChainValues = [
  { service: 'dellite.worker.device', username: 'device_id' },
  { service: 'dellite.device', username: 'device_id' },
] as const;

function resolvePlatform(): DeviceSessionUpsertPayload['platform'] {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

function normalizeToken(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveApplicationScope(role: DeviceSessionRole) {
  return normalizeToken(Application.applicationId) ?? role.toLowerCase();
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

async function resolveRuntimeDeviceId() {
  const appScope = resolveApplicationScope('WORKER');

  if (Platform.OS === 'android') {
    const androidId = normalizeToken(Application.getAndroidId());
    if (!androidId) {
      throw new Error('Unable to resolve Android deviceId from Application.getAndroidId().');
    }
    return `${appScope}:${androidId}`;
  }

  if (Platform.OS === 'ios') {
    const iosId = normalizeToken(await Application.getIosIdForVendorAsync());
    if (!iosId) {
      throw new Error('Unable to resolve iOS deviceId from Application.getIosIdForVendorAsync().');
    }
    return `${appScope}:${iosId}`;
  }

  throw new Error(`Unsupported platform "${Platform.OS}" for device session registration.`);
}

export async function getStableDeviceId() {
  const storedDeviceId = normalizeToken(await getSecureValue(keyChainValues.deviceService, keyChainValues.deviceUsername));
  if (storedDeviceId) {
    return storedDeviceId;
  }

  for (const legacyKey of legacyDeviceKeyChainValues) {
    const legacyDeviceId = normalizeToken(await getSecureValue(legacyKey.service, legacyKey.username));
    if (!legacyDeviceId) continue;

    await saveSecureValue(keyChainValues.deviceService, keyChainValues.deviceUsername, legacyDeviceId);
    await removeSecureValue(legacyKey.service, legacyKey.username);
    return legacyDeviceId;
  }

  const deviceId = await resolveRuntimeDeviceId();
  await saveSecureValue(keyChainValues.deviceService, keyChainValues.deviceUsername, deviceId);
  return deviceId;
}

export async function clearStableDeviceId() {
  await removeSecureValue(keyChainValues.deviceService, keyChainValues.deviceUsername);
}

export async function setPendingFcmToken(token: string | null | undefined) {
  await setPendingPushToken(token);
}

export async function getPendingFcmToken() {
  return getPendingPushToken();
}

export async function syncPendingFcmTokenFromDevice() {
  return syncPendingPushTokenFromDevice();
}

export function registerFcmTokenRefreshListener(onToken: (token: string) => void) {
  return registerPushTokenRefreshListener(onToken);
}

async function resolveFcmTokenForDeviceSession() {
  const cachedToken = normalizeToken(await getPendingPushToken());
  if (cachedToken) {
    return cachedToken;
  }

  return normalizeToken(await syncPendingPushTokenFromDevice());
}

export async function buildDeviceSessionPayload(role: DeviceSessionRole): Promise<DeviceSessionUpsertPayload> {
  const [deviceId, fcmToken] = await Promise.all([
    getStableDeviceId(),
    resolveFcmTokenForDeviceSession(),
  ]);

  return {
    role,
    platform: resolvePlatform(),
    deviceId,
    deviceName: resolveDeviceName(),
    ...(fcmToken ? { fcmToken } : {}),
  };
}
