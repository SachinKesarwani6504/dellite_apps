import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';
import {
  getSecureValue,
  removeSecureValue,
  saveSecureValue,
} from '@/utils/key-chain-storage/key-chain-service';

function logOnboardingStorage(step: string, payload?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-onboarding-storage] ${step}`, payload);
}

export async function saveOnboardingPhoneToken(phoneToken: string): Promise<void> {
  logOnboardingStorage('save:start', {
    service: keyChainValues.onboardingService,
    username: keyChainValues.onboardingUsername,
    phoneToken,
  });
  await saveSecureValue(
    keyChainValues.onboardingService,
    keyChainValues.onboardingUsername,
    phoneToken,
  );
  const readBack = await getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  logOnboardingStorage('save:done', { readBack });
}

export async function getOnboardingPhoneToken(): Promise<string | null> {
  const value = await getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  logOnboardingStorage('get', {
    service: keyChainValues.onboardingService,
    username: keyChainValues.onboardingUsername,
    value,
  });
  return value;
}

export async function clearOnboardingPhoneToken(): Promise<void> {
  logOnboardingStorage('clear:start', {
    service: keyChainValues.onboardingService,
    username: keyChainValues.onboardingUsername,
  });
  await removeSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  const readBack = await getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  logOnboardingStorage('clear:done', { readBack });
}
