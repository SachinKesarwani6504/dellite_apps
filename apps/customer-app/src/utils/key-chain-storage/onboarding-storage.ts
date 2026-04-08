import { keyChainValues } from '@/utils/key-chain-storage/key-chain-values';
import {
  getSecureValue,
  removeSecureValue,
  saveSecureValue,
} from '@/utils/key-chain-storage/key-chain-service';

export async function saveOnboardingPhoneToken(phoneToken: string): Promise<void> {
  await saveSecureValue(
    keyChainValues.onboardingService,
    keyChainValues.onboardingUsername,
    phoneToken,
  );
}

export async function getOnboardingPhoneToken(): Promise<string | null> {
  return getSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
}

export async function clearOnboardingPhoneToken(): Promise<void> {
  await removeSecureValue(keyChainValues.onboardingService, keyChainValues.onboardingUsername);
}
