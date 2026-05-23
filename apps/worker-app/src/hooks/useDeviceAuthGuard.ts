import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { DEVICE_AUTH_STATUS } from '@/types/device-auth';
import type { DeviceAuthGuardResult, DeviceAuthOptions, DeviceAuthStatus } from '@/types/device-auth';

export function useDeviceAuthGuard(options: DeviceAuthOptions): DeviceAuthGuardResult {
  const [status, setStatus] = useState<DeviceAuthStatus>(DEVICE_AUTH_STATUS.LOCKED);

  const lock = useCallback(() => {
    setStatus(DEVICE_AUTH_STATUS.LOCKED);
  }, []);

  const authenticate = useCallback(async () => {
    setStatus(DEVICE_AUTH_STATUS.LOADING);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setStatus(DEVICE_AUTH_STATUS.UNAVAILABLE);
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage,
        promptSubtitle: options.promptSubtitle,
        cancelLabel: options.cancelLabel,
        disableDeviceFallback: false,
        biometricsSecurityLevel: 'strong',
      });

      if (result.success) {
        setStatus(DEVICE_AUTH_STATUS.UNLOCKED);
        return true;
      }

      if (result.error === 'user_cancel' || result.error === 'system_cancel' || result.error === 'app_cancel') {
        setStatus(DEVICE_AUTH_STATUS.CANCELLED);
        return false;
      }

      setStatus(DEVICE_AUTH_STATUS.FAILED);
      return false;
    } catch {
      setStatus(DEVICE_AUTH_STATUS.FAILED);
      return false;
    }
  }, [options.cancelLabel, options.promptMessage, options.promptSubtitle]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        setStatus(DEVICE_AUTH_STATUS.LOCKED);
      }
    });

    return () => {
      subscription.remove();
      setStatus(DEVICE_AUTH_STATUS.LOCKED);
    };
  }, []);

  return {
    status,
    isUnlocked: status === DEVICE_AUTH_STATUS.UNLOCKED,
    authenticate,
    lock,
  };
}
