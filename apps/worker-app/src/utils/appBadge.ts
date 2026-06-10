import * as Notifications from 'expo-notifications';
import { getNotificationUnreadCount } from '@/actions/notificationActions';

const BADGE_SYNC_THROTTLE_MS = 2500;

let lastBadgeSyncAt = 0;
let badgeSyncPromise: Promise<number | null> | null = null;

function logBadge(step: string, payload?: Record<string, unknown>) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-badge] ${step}`, payload ?? {});
}

function normalizeBadgeCount(count: unknown) {
  const numericCount = typeof count === 'number' ? count : Number(count);
  if (!Number.isFinite(numericCount)) {
    return 0;
  }
  return Math.max(0, Math.floor(numericCount));
}

export function getBadgeCountFromPayload(data?: Record<string, unknown> | null) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const rawBadgeCount = data.badgeCount ?? data.badge_count ?? data.badge;
  const badgeCount = normalizeBadgeCount(rawBadgeCount);
  return rawBadgeCount == null ? null : badgeCount;
}

export async function updateAppBadgeCount(count: number) {
  try {
    const safeCount = normalizeBadgeCount(count);
    const didSetBadge = await Notifications.setBadgeCountAsync(safeCount);
    logBadge('set-complete', { count: safeCount, didSetBadge });
    return didSetBadge;
  } catch (error) {
    logBadge('set-failed', {
      message: error instanceof Error ? error.message : 'Unknown badge error',
    });
    return false;
  }
}

export async function clearAppBadgeCount() {
  return updateAppBadgeCount(0);
}

export async function syncAppBadgeCountFromBackend(force = false) {
  const now = Date.now();
  if (!force && badgeSyncPromise) {
    return badgeSyncPromise;
  }

  if (!force && now - lastBadgeSyncAt < BADGE_SYNC_THROTTLE_MS) {
    return null;
  }

  lastBadgeSyncAt = now;
  badgeSyncPromise = (async () => {
    try {
      const response = await getNotificationUnreadCount();
      const badgeCount = normalizeBadgeCount(response.badgeCount);
      await updateAppBadgeCount(badgeCount);
      return badgeCount;
    } catch (error) {
      logBadge('sync-failed', {
        message: error instanceof Error ? error.message : 'Unknown badge sync error',
      });
      return null;
    } finally {
      badgeSyncPromise = null;
    }
  })();

  return badgeSyncPromise;
}
