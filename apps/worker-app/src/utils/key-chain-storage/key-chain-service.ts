import * as Keychain from 'react-native-keychain';
import * as SecureStore from 'expo-secure-store';

function getSecureStoreKey(service: string, username: string) {
  const raw = `${service}_${username}`;
  const sanitized = raw.replace(/[^A-Za-z0-9._-]/g, '_');
  return sanitized.length > 0 ? sanitized : 'secure_value';
}

function canUseKeychain() {
  return (
    typeof Keychain?.setGenericPassword === 'function' &&
    typeof Keychain?.getGenericPassword === 'function' &&
    typeof Keychain?.resetGenericPassword === 'function'
  );
}

export async function saveSecureValue(service: string, username: string, value: string): Promise<void> {
  let keychainSaved = false;
  if (canUseKeychain()) {
    try {
      await Keychain.setGenericPassword(username, value, {
        service,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      keychainSaved = true;
    } catch {
      // Continue and persist fallback copy in SecureStore.
    }
  }

  try {
    await SecureStore.setItemAsync(getSecureStoreKey(service, username), value);
  } catch (error) {
    if (!keychainSaved) {
      throw error;
    }
  }
}

export async function getSecureValue(service: string, username: string): Promise<string | null> {
  if (canUseKeychain()) {
    try {
      const credentials = await Keychain.getGenericPassword({ service });
      if (
        credentials
        && typeof credentials === 'object'
        && 'password' in credentials
        && typeof credentials.password === 'string'
      ) {
        return credentials.password;
      }
    } catch {
      // Fallback to SecureStore
    }
  }

  const fallback = await SecureStore.getItemAsync(getSecureStoreKey(service, username));
  if (!fallback || !canUseKeychain()) {
    return fallback;
  }

  try {
    await Keychain.setGenericPassword(username, fallback, {
      service,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Keep fallback value even if keychain backfill fails.
  }

  return fallback;
}

export async function removeSecureValue(service: string, username: string): Promise<void> {
  if (canUseKeychain()) {
    try {
      await Keychain.resetGenericPassword({ service });
    } catch {
      // Ignore and continue with fallback cleanup.
    }
  }

  await SecureStore.deleteItemAsync(getSecureStoreKey(service, username));
}
