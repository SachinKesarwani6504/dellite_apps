import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';
import {
  getSecureValue,
  removeSecureValue,
  saveSecureValue,
} from '@/utils/key-chain-storage/key-chain-service';

const legacyOnboardingKeyChainValues = [
  { service: 'dellite.customer.onboarding', username: 'phone_token' },
  { service: 'dellite.onboarding', username: 'phone_token' },
] as const;

export async function saveOnboardingPhoneToken(phoneToken: string): Promise<void> {
  await saveSecureValue(
    keyChainValues.onboardingService,
    keyChainValues.onboardingUsername,
    phoneToken,
  );
}

export async function getOnboardingPhoneToken(): Promise<string | null> {
  const value = await getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
  if (value) return value;

  for (const legacyKey of legacyOnboardingKeyChainValues) {
    const legacyValue = await getSecureValue(legacyKey.service, legacyKey.username);
    if (!legacyValue) continue;

    await saveOnboardingPhoneToken(legacyValue);
    await removeSecureValue(legacyKey.service, legacyKey.username);
    return legacyValue;
  }

  return null;
}

export async function clearOnboardingPhoneToken(): Promise<void> {
  await removeSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
}
