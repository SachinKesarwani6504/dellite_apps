import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';
import {
  getSecureValue,
  removeSecureValue,
  saveSecureValue,
} from '@/utils/key-chain-storage/key-chain-service';

const legacyOnboardingKeyChainValues = [
  { service: 'dellite.worker.onboarding', username: 'phone_token' },
  { service: 'dellite.onboarding', username: 'phone_token' },
] as const;

function logOnboardingStorage(step: string, payload?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-onboarding-storage] ${step}`, payload);
}

export async function saveOnboardingPhoneToken(phoneToken: string): Promise<void> {
  logOnboardingStorage('save:start', {
    service: keyChainValues.onboardingService,
    username: keyChainValues.onboardingUsername,
    hasPhoneToken: Boolean(phoneToken),
  });
  await saveSecureValue(
    keyChainValues.onboardingService,
    keyChainValues.onboardingUsername,
    phoneToken,
  );
  const readBack = await getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  logOnboardingStorage('save:done', { hasReadBack: Boolean(readBack) });
}

export async function getOnboardingPhoneToken(): Promise<string | null> {
  const value = await getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  if (value) {
    logOnboardingStorage('get', {
      service: keyChainValues.onboardingService,
      username: keyChainValues.onboardingUsername,
      hasValue: true,
    });
    return value;
  }

  for (const legacyKey of legacyOnboardingKeyChainValues) {
    const legacyValue = await getSecureValue(legacyKey.service, legacyKey.username);
    if (!legacyValue) continue;

    await saveOnboardingPhoneToken(legacyValue);
    await removeSecureValue(legacyKey.service, legacyKey.username);
    logOnboardingStorage('get:migrated-legacy', { service: legacyKey.service, username: legacyKey.username });
    return legacyValue;
  }

  logOnboardingStorage('get', {
    service: keyChainValues.onboardingService,
    username: keyChainValues.onboardingUsername,
    hasValue: false,
  });
  return null;
}

export async function clearOnboardingPhoneToken(): Promise<void> {
  logOnboardingStorage('clear:start', {
    service: keyChainValues.onboardingService,
    username: keyChainValues.onboardingUsername,
  });
  await removeSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  const readBack = await getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  logOnboardingStorage('clear:done', { hasReadBack: Boolean(readBack) });
}
