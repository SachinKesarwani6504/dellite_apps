import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY_PREFIX = 'dellite:live-notification-delivered-ids';
const MAX_STORED_IDS = 120;

function normalizeNotificationId(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function normalizeStoredIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeNotificationId)
    .filter((item): item is string => Boolean(item));
}

function compactIds(ids: Iterable<string>) {
  const uniqueIds = Array.from(new Set(Array.from(ids).map(normalizeNotificationId).filter((item): item is string => Boolean(item))));
  return uniqueIds.slice(-MAX_STORED_IDS);
}

export async function loadDeliveredLiveNotificationIds(userId: string | null | undefined): Promise<Set<string>> {
  if (!userId) {
    return new Set();
  }

  try {
    const storedValue = await SecureStore.getItemAsync(getStorageKey(userId));
    if (!storedValue) {
      return new Set();
    }

    const parsedValue = JSON.parse(storedValue) as unknown;
    return new Set(normalizeStoredIds(parsedValue));
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[worker-live-notification-delivery] load-failed', error);
    }
    return new Set();
  }
}

export async function saveDeliveredLiveNotificationIds(
  userId: string | null | undefined,
  ids: Iterable<string>,
) {
  if (!userId) {
    return;
  }

  try {
    const compactedIds = compactIds(ids);
    if (compactedIds.length === 0) {
      await SecureStore.deleteItemAsync(getStorageKey(userId));
      return;
    }

    await SecureStore.setItemAsync(getStorageKey(userId), JSON.stringify(compactedIds));
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[worker-live-notification-delivery] save-failed', error);
    }
  }
}

