import { useEffect, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { onDisconnect } from 'firebase/database';
import { buildUserPresencePayload, getRealtimeServerTimestamp, getUserPresenceRef, updateUserPresence } from '@/lib/firebase';
import { APP_AUTH_ROLE } from '@/types/auth';
import { getFirebaseLiveLocationUserIdClaim } from '@/utils/firebase-session';

const PRESENCE_HEARTBEAT_MS = 30000;
const PRESENCE_RETRY_MS = 3000;

function logPresence(step: string, payload?: Record<string, unknown>) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[worker-presence] ${step}`, payload ?? {});
}

function resolveAppState(nextState: AppStateStatus) {
  if (nextState === 'active') {
    return 'FOREGROUND';
  }

  if (nextState === 'background') {
    return 'BACKGROUND';
  }

  return 'OFFLINE';
}

function now() {
  return Date.now();
}

export function useUserPresence({
  userId,
  roleEntityId,
  enabled = true,
}: {
  userId: string | null | undefined;
  roleEntityId: string | null | undefined;
  enabled?: boolean;
}) {
  const currentStateRef = useRef<AppStateStatus>(AppState.currentState);
  const cleanupInProgressRef = useRef(false);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let resolvedPresenceUserId: string | null = null;
    let resolvedRoleEntityId: string | null = null;
    let presenceRef: ReturnType<typeof getUserPresenceRef> | null = null;

    const clearRetryTimer = () => {
      if (!retryTimer) return;
      clearTimeout(retryTimer);
      retryTimer = null;
    };

    const scheduleRetry = (nextAppState: AppStateStatus) => {
      if (disposed || retryTimer) {
        return;
      }

      retryTimer = setTimeout(() => {
        retryTimer = null;
        void markPresence(nextAppState, 'retry');
      }, PRESENCE_RETRY_MS);
    };

    const markPresence = async (nextAppState: AppStateStatus, reason: string) => {
      if (!resolvedPresenceUserId || !resolvedRoleEntityId || !presenceRef) {
        scheduleRetry(nextAppState);
        return;
      }

      const appState = resolveAppState(nextAppState);
      const timestamp = now();

      try {
        await updateUserPresence(resolvedPresenceUserId, resolvedRoleEntityId, buildUserPresencePayload(APP_AUTH_ROLE, resolvedPresenceUserId, resolvedRoleEntityId, {
          appState,
          isConnected: true,
          lastSeenAt: timestamp,
          disconnectedAt: null,
          updatedAt: timestamp,
        }));
        logPresence('updated', { userId: resolvedPresenceUserId, appState, reason });
      } catch (error) {
        logPresence('update-failed', {
          userId: resolvedPresenceUserId,
          appState,
          reason,
          message: error instanceof Error ? error.message : 'Unknown presence update error',
        });
        scheduleRetry(nextAppState);
      }
    };

    const setup = async () => {
      resolvedPresenceUserId = (await getFirebaseLiveLocationUserIdClaim()) ?? userId;
      if (!resolvedPresenceUserId) {
        logPresence('setup-skipped-no-presence-user-id', { userId });
        return;
      }
      resolvedRoleEntityId = roleEntityId ?? resolvedPresenceUserId;

      presenceRef = getUserPresenceRef(resolvedPresenceUserId, resolvedRoleEntityId);

      try {
        await onDisconnect(presenceRef).update(buildUserPresencePayload(APP_AUTH_ROLE, resolvedPresenceUserId, resolvedRoleEntityId, {
          appState: 'OFFLINE',
          isConnected: false,
          lastSeenAt: now(),
          disconnectedAt: getRealtimeServerTimestamp() as unknown as number,
          updatedAt: getRealtimeServerTimestamp() as unknown as number,
        }));
        logPresence('ondisconnect-registered', { userId: resolvedPresenceUserId });
      } catch (error) {
        logPresence('ondisconnect-register-failed', {
          userId: resolvedPresenceUserId,
          message: error instanceof Error ? error.message : 'Unknown onDisconnect error',
        });
      }

      await markPresence(currentStateRef.current, 'setup');
    };

    void setup();
    heartbeatTimer = setInterval(() => {
      void markPresence(currentStateRef.current, 'heartbeat');
    }, PRESENCE_HEARTBEAT_MS);

    const subscription = AppState.addEventListener('change', (nextState) => {
      currentStateRef.current = nextState;
      clearRetryTimer();
      void markPresence(nextState, 'app-state-change');
    });

    return () => {
      disposed = true;
      cleanupInProgressRef.current = true;
      subscription.remove();
      clearRetryTimer();
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      void (async () => {
        try {
          if (!resolvedPresenceUserId || !resolvedRoleEntityId) {
            return;
          }

          await updateUserPresence(resolvedPresenceUserId, resolvedRoleEntityId, buildUserPresencePayload(APP_AUTH_ROLE, resolvedPresenceUserId, resolvedRoleEntityId, {
            appState: 'OFFLINE',
            isConnected: false,
            lastSeenAt: now(),
            disconnectedAt: now(),
            updatedAt: now(),
          }));
          logPresence('offline-cleanup-written', { userId: resolvedPresenceUserId });
        } catch {
          // Non-blocking cleanup.
        }

        try {
          if (presenceRef) {
            await onDisconnect(presenceRef).cancel();
          }
        } catch {
          // Ignore cleanup failures.
        } finally {
          cleanupInProgressRef.current = false;
        }
      })();
    };
  }, [enabled, roleEntityId, userId]);

  return useMemo(() => ({
    isActive: enabled && Boolean(userId) && !cleanupInProgressRef.current,
  }), [enabled, userId]);
}
