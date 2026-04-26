import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  WorkerLiveAppState,
  WorkerLiveLocationRecord,
  getRealtimeServerTimestamp,
  registerWorkerLiveOnDisconnect,
  removeWorkerLive,
  setWorkerLive,
  updateWorkerLive,
} from '@/lib/firebase';
import {
  LOCATION_TRACKING_CONFIG,
  resolveWorkerTrackingProfile,
  shouldSendWorkerLocationUpdate,
} from '@/lib/location-tracking/locationTrackingConfig';
import {
  ENABLE_BACKGROUND_LOCATION_TRACKING,
  REMOVE_WORKER_LIVE_NODE_ON_OFFLINE,
  WORKER_BACKGROUND_LOCATION_TASK_NAME,
} from '@/lib/firebase/constants';
import {
  getFirebaseLiveLocationUserIdClaim,
  getFirebaseSessionDebugSnapshot,
  hasFirebaseAuthenticatedUser,
  isFirebaseSessionError,
  markFirebaseReauthRequired,
} from '@/utils/firebase-session';
import { calculateHaversineDistanceInMeters } from '@/utils/locationDistance';

type LastSentLocationSnapshot = {
  lat: number;
  lng: number;
  sentAt: number;
};

type WorkerLiveRuntimeContext = {
  workerId: string | null;
  activeBookingId: string | null;
  isAvailable: boolean;
  appState: WorkerLiveAppState;
};

type UseWorkerLiveLocationArgs = {
  workerId?: string | null;
};

type WorkerLiveLocationState = {
  isOnline: boolean;
  isTracking: boolean;
  isAvailable: boolean;
  activeBookingId: string | null;
  permissionStatus: Location.PermissionStatus;
  appState: WorkerLiveAppState;
  lastLocation: WorkerLiveLocationRecord | null;
  lastSyncedAt: number | null;
  error: string | null;
};

type UpdateLocationOptions = {
  force: boolean;
};

const FIREBASE_RECOVERY_COOLDOWN_MS = 15000;

const backgroundRuntimeContext: WorkerLiveRuntimeContext = {
  workerId: null,
  activeBookingId: null,
  isAvailable: false,
  appState: 'FOREGROUND',
};

const backgroundLastSentByWorker = new Map<string, LastSentLocationSnapshot>();

function toWorkerLiveAppState(nextAppState: AppStateStatus): WorkerLiveAppState {
  return nextAppState === 'active' ? 'FOREGROUND' : 'BACKGROUND';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeLocationValue(value: number | null | undefined, fallback = 0) {
  return isFiniteNumber(value) ? value : fallback;
}

function resolveRealtimeDatabaseErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('PERMISSION_DENIED')) {
    return 'Realtime Database write denied. Wait for backend auth refresh to re-establish Firebase session and verify rules.';
  }
  return message || fallback;
}

function resolveSpeedMetersPerSecond(
  location: Location.LocationObject,
  hasPrevious: boolean,
  elapsedMs: number,
  movedMeters: number,
) {
  if (!hasPrevious) {
    return normalizeLocationValue(location.coords.speed);
  }

  if (elapsedMs <= 0) {
    return normalizeLocationValue(location.coords.speed);
  }

  const speedMetersPerSecond = movedMeters / (elapsedMs / 1000);
  return Number.isFinite(speedMetersPerSecond)
    ? Number(speedMetersPerSecond.toFixed(2))
    : normalizeLocationValue(location.coords.speed);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeHeadingDegrees(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function resolveHeadingDegrees(
  location: Location.LocationObject,
  previousSnapshot: LastSentLocationSnapshot | null,
  nextSnapshot: LastSentLocationSnapshot,
) {
  const rawHeading = location.coords.heading;
  if (isFiniteNumber(rawHeading) && rawHeading >= 0) {
    return Number(normalizeHeadingDegrees(rawHeading).toFixed(2));
  }

  if (!previousSnapshot) {
    return 0;
  }

  const movedMeters = calculateHaversineDistanceInMeters(
    { lat: previousSnapshot.lat, lng: previousSnapshot.lng },
    { lat: nextSnapshot.lat, lng: nextSnapshot.lng },
  );
  if (movedMeters < 2) {
    return 0;
  }

  const lat1 = toRadians(previousSnapshot.lat);
  const lat2 = toRadians(nextSnapshot.lat);
  const deltaLng = toRadians(nextSnapshot.lng - previousSnapshot.lng);
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = (Math.cos(lat1) * Math.sin(lat2))
    - (Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng));
  const bearing = toDegrees(Math.atan2(y, x));
  return Number(normalizeHeadingDegrees(bearing).toFixed(2));
}

function buildWorkerLivePayload(
  userId: string,
  location: Location.LocationObject,
  headingDegrees: number,
  speedMetersPerSecond: number,
  isAvailable: boolean,
  activeBookingId: string | null,
  appState: WorkerLiveAppState,
): WorkerLiveLocationRecord {
  const now = Date.now();
  const accuracy = normalizeLocationValue(location.coords.accuracy);

  return {
    userId,
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    accuracy,
    heading: headingDegrees,
    speed: speedMetersPerSecond,
    lastLocationAt: isFiniteNumber(location.timestamp) ? location.timestamp : now,
    heartbeatAt: now,
    isAvailable,
    isTrackable: true,
    activeBookingId,
    appState,
  };
}

async function writeBackgroundLocationUpdate(location: Location.LocationObject, force: boolean) {
  const workerId = backgroundRuntimeContext.workerId;
  if (!workerId) return;

  const now = Date.now();
  const nextSnapshot: LastSentLocationSnapshot = {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    sentAt: now,
  };

  const previousSnapshot = backgroundLastSentByWorker.get(workerId) ?? null;
  const elapsedMs = previousSnapshot ? (nextSnapshot.sentAt - previousSnapshot.sentAt) : 0;
  const movedMeters = previousSnapshot
    ? calculateHaversineDistanceInMeters(
      { lat: previousSnapshot.lat, lng: previousSnapshot.lng },
      { lat: nextSnapshot.lat, lng: nextSnapshot.lng },
    )
    : 0;
  const speedMetersPerSecond = resolveSpeedMetersPerSecond(
    location,
    Boolean(previousSnapshot),
    elapsedMs,
    movedMeters,
  );

  const shouldWrite = shouldSendWorkerLocationUpdate({
    hasPrevious: Boolean(previousSnapshot),
    force,
    activeBookingId: backgroundRuntimeContext.activeBookingId,
    elapsedMs,
    movedMeters,
    speedMps: speedMetersPerSecond,
  });

  if (!shouldWrite) return;

  const headingDegrees = resolveHeadingDegrees(location, previousSnapshot, nextSnapshot);
  const payload = buildWorkerLivePayload(
    workerId,
    location,
    headingDegrees,
    speedMetersPerSecond,
    backgroundRuntimeContext.isAvailable,
    backgroundRuntimeContext.activeBookingId,
    backgroundRuntimeContext.appState,
  );

  await setWorkerLive(workerId, payload);
  backgroundLastSentByWorker.set(workerId, nextSnapshot);
}

if (!TaskManager.isTaskDefined(WORKER_BACKGROUND_LOCATION_TASK_NAME)) {
  TaskManager.defineTask(WORKER_BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) return;

    const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
    const latestLocation = locations && locations.length > 0 ? locations[locations.length - 1] : null;
    if (!latestLocation) return;

    try {
      await writeBackgroundLocationUpdate(latestLocation, false);
    } catch {
      // Ignore background write errors.
    }
  });
}

export function useWorkerLiveLocation({
  workerId,
}: UseWorkerLiveLocationArgs = {}) {
  const [state, setState] = useState<WorkerLiveLocationState>({
    isOnline: false,
    isTracking: false,
    isAvailable: false,
    activeBookingId: null,
    permissionStatus: Location.PermissionStatus.UNDETERMINED,
    appState: toWorkerLiveAppState(AppState.currentState),
    lastLocation: null,
    lastSyncedAt: null,
    error: null,
  });

  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFirebaseSessionMissingAtRef = useRef(0);
  const isOnlineRef = useRef(false);
  const isTrackingRef = useRef(false);
  const isAvailableRef = useRef(false);
  const activeBookingIdRef = useRef<string | null>(null);
  const workerIdRef = useRef<string | null>(workerId ?? null);
  const appStateRef = useRef<WorkerLiveAppState>(toWorkerLiveAppState(AppState.currentState));
  const lastSentLocationRef = useRef<LastSentLocationSnapshot | null>(null);

  const log = useCallback((message: string, payload?: unknown) => {
    if (!__DEV__) return;
    if (message !== 'live-location:fetched' && message !== 'live-location:written') {
      return;
    }
    if (payload === undefined) {
      // eslint-disable-next-line no-console
      console.log(`[worker-live-location] ${message}`);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`[worker-live-location] ${message}`, payload);
  }, []);

  const trace = useCallback((_step: string, _message: string, _payload?: unknown) => {}, []);

  const setError = useCallback((message: string | null) => {
    setState(current => ({ ...current, error: message }));
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const stopForegroundWatch = useCallback(async () => {
    const existingWatch = watchSubscriptionRef.current;
    if (!existingWatch) return;
    existingWatch.remove();
    watchSubscriptionRef.current = null;
  }, []);

  const stopBackgroundWatch = useCallback(async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(WORKER_BACKGROUND_LOCATION_TASK_NAME);
    if (!hasStarted) return;
    await Location.stopLocationUpdatesAsync(WORKER_BACKGROUND_LOCATION_TASK_NAME);
  }, []);

  const writeLiveLocation = useCallback(
    async (location: Location.LocationObject, options: UpdateLocationOptions) => {
      const workerIdValue = workerIdRef.current;
      trace('WL-07', 'writeLiveLocation:start', {
        workerId: workerIdValue,
      });
      log('writeLiveLocation:start', {
        workerId: workerIdValue,
        force: options.force,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        locationTimestamp: location.timestamp,
      });
      if (!workerIdValue) {
        setError('Cannot write worker location without workerId.');
        trace('WL-07E', 'writeLiveLocation:missing-user-id');
        log('writeLiveLocation:skip-missing-worker-id');
        return false;
      }

      const now = Date.now();
      const nextSnapshot: LastSentLocationSnapshot = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        sentAt: now,
      };
      const previousSnapshot = lastSentLocationRef.current;
      const elapsedMs = previousSnapshot ? (nextSnapshot.sentAt - previousSnapshot.sentAt) : 0;
      const movedMeters = previousSnapshot
        ? calculateHaversineDistanceInMeters(
          { lat: previousSnapshot.lat, lng: previousSnapshot.lng },
          { lat: nextSnapshot.lat, lng: nextSnapshot.lng },
        )
        : 0;
      const speedMetersPerSecond = resolveSpeedMetersPerSecond(
        location,
        Boolean(previousSnapshot),
        elapsedMs,
        movedMeters,
      );

      const shouldWrite = shouldSendWorkerLocationUpdate({
        hasPrevious: Boolean(previousSnapshot),
        force: options.force,
        activeBookingId: activeBookingIdRef.current,
        elapsedMs,
        movedMeters,
        speedMps: speedMetersPerSecond,
      });

      if (!shouldWrite) {
        return false;
      }
      const headingDegrees = resolveHeadingDegrees(
        location,
        previousSnapshot,
        nextSnapshot,
      );
      const payload = buildWorkerLivePayload(
        workerIdValue,
        location,
        headingDegrees,
        speedMetersPerSecond,
        isAvailableRef.current,
        activeBookingIdRef.current,
        appStateRef.current,
      );

      if (!hasFirebaseAuthenticatedUser()) {
        trace('WL-07E', 'writeLiveLocation:no-firebase-session');
        const debugSnapshot = await getFirebaseSessionDebugSnapshot();
        log('writeLiveLocation:firebase-session-debug', debugSnapshot);
        const now = Date.now();
        if (now - lastFirebaseSessionMissingAtRef.current > FIREBASE_RECOVERY_COOLDOWN_MS) {
          setError('Firebase session missing. Waiting for next backend refresh cycle to re-authenticate.');
          lastFirebaseSessionMissingAtRef.current = now;
        }
        log('writeLiveLocation:skip-no-firebase-session', {
          workerId: workerIdValue,
          retryAfterMs: FIREBASE_RECOVERY_COOLDOWN_MS,
        });
        return false;
      }

      try {
        trace('WL-08', 'writeLiveLocation:rtdb-set-attempt', {
          path: `user-live-location/${workerIdValue}`,
        });
        const debugSnapshot = await getFirebaseSessionDebugSnapshot();
        log('writeLiveLocation:before-rtdb-session-debug', debugSnapshot);
        log('writeLiveLocation:rtdb-set-attempt', {
          path: `user-live-location/${workerIdValue}`,
          isAvailable: payload.isAvailable,
          isTrackable: payload.isTrackable,
          activeBookingId: payload.activeBookingId,
          appState: payload.appState,
          speed: payload.speed,
          accuracy: payload.accuracy,
        });
        await setWorkerLive(workerIdValue, payload);
      } catch (error) {
        trace('WL-08E', 'writeLiveLocation:rtdb-set-error', {
          message: error instanceof Error ? error.message : String(error),
        });
        if (isFirebaseSessionError(error)) {
          markFirebaseReauthRequired();
          setError('Firebase session expired. Waiting for next backend refresh cycle to re-authenticate.');
          log('writeLiveLocation:firebaseSessionInvalid', error);
          return false;
        }
        const message = resolveRealtimeDatabaseErrorMessage(error, 'Failed to write live location.');
        setError(message);
        log('writeLiveLocation:error', error);
        return false;
      }

      lastSentLocationRef.current = nextSnapshot;
      trace('WL-09', 'writeLiveLocation:success', {
        path: `user-live-location/${workerIdValue}`,
      });
      log('live-location:written', {
        userId: workerIdValue,
        lat: payload.lat,
        lng: payload.lng,
        heartbeatAt: payload.heartbeatAt,
        lastLocationAt: payload.lastLocationAt,
      });
      setState(current => ({
        ...current,
        lastLocation: payload,
        lastSyncedAt: now,
      }));
      return true;
    },
    [setError],
  );

  const canWriteRealtimeData = useCallback(() => {
    if (hasFirebaseAuthenticatedUser()) {
      trace('WL-04', 'canWriteRealtimeData:ok');
      void getFirebaseSessionDebugSnapshot().then(snapshot => {
        log('canWriteRealtimeData:session-debug', snapshot);
      });
      log('canWriteRealtimeData:ok');
      return true;
    }

    void getFirebaseSessionDebugSnapshot().then(snapshot => {
      log('canWriteRealtimeData:blocked-session-debug', snapshot);
    });
    trace('WL-04E', 'canWriteRealtimeData:blocked-no-firebase-session');
    const now = Date.now();
    if (now - lastFirebaseSessionMissingAtRef.current > FIREBASE_RECOVERY_COOLDOWN_MS) {
      setError('Firebase session missing. Waiting for next backend refresh cycle to re-authenticate.');
      lastFirebaseSessionMissingAtRef.current = now;
    }
    log('canWriteRealtimeData:blocked-no-firebase-session', {
      retryAfterMs: FIREBASE_RECOVERY_COOLDOWN_MS,
    });
    return false;
  }, [log, setError, trace]);

  const refreshCurrentLocation = useCallback(async () => {
    const workerIdValue = workerIdRef.current;
    if (!workerIdValue) {
      setError('Cannot refresh location without workerId.');
      log('refreshCurrentLocation:skip-missing-worker-id');
      return null;
    }

    try {
      log('refreshCurrentLocation:getCurrentPosition:start', {
        workerId: workerIdValue,
        trackingProfile: resolveWorkerTrackingProfile(activeBookingIdRef.current),
      });
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: resolveWorkerTrackingProfile(activeBookingIdRef.current).accuracy,
      });
      log('live-location:fetched', {
        userId: workerIdValue,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      });
      const didWrite = await writeLiveLocation(currentLocation, { force: true });
      if (didWrite) {
        setError(null);
      }
      return currentLocation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh current location.';
      setError(message);
      log('refreshCurrentLocation:error', error);
      return null;
    }
  }, [log, setError, writeLiveLocation]);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    log('heartbeat:start', {
      intervalMs: LOCATION_TRACKING_CONFIG.heartbeatIntervalMs,
    });

    heartbeatIntervalRef.current = setInterval(() => {
      const workerIdValue = workerIdRef.current;
      if (!workerIdValue || !isOnlineRef.current) {
        return;
      }

      if (!canWriteRealtimeData()) {
        log('heartbeat:skip-cannot-write');
        return;
      }

      void updateWorkerLive(workerIdValue, {
        heartbeatAt: Date.now(),
        isTrackable: true,
        isAvailable: isAvailableRef.current,
        activeBookingId: activeBookingIdRef.current,
        appState: appStateRef.current,
      }).catch(error => {
        if (isFirebaseSessionError(error)) {
          markFirebaseReauthRequired();
        }
        log('heartbeat:error', error);
      });
    }, LOCATION_TRACKING_CONFIG.heartbeatIntervalMs);
  }, [canWriteRealtimeData, clearHeartbeat, log]);

  const startForegroundWatch = useCallback(async () => {
    await stopForegroundWatch();

    const trackingProfile = resolveWorkerTrackingProfile(activeBookingIdRef.current);
    log('startForegroundWatch:start', {
      trackingProfile,
      activeBookingId: activeBookingIdRef.current,
    });
    watchSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: trackingProfile.accuracy,
        timeInterval: trackingProfile.timeIntervalMs,
        distanceInterval: trackingProfile.distanceIntervalMeters,
      },
      location => {
        log('startForegroundWatch:onLocation', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        });
        void writeLiveLocation(location, { force: false }).catch(error => {
          log('foregroundWatch:writeError', error);
        });
      },
    );
    log('startForegroundWatch:success');
  }, [log, stopForegroundWatch, writeLiveLocation]);

  const startBackgroundWatch = useCallback(async () => {
    const trackingProfile = resolveWorkerTrackingProfile(activeBookingIdRef.current);
    // Background tracking has platform limits (battery optimizations, OEM restrictions,
    // iOS capabilities). Keep it behind a feature flag and validate permissions/config first.
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(WORKER_BACKGROUND_LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(WORKER_BACKGROUND_LOCATION_TASK_NAME);
    }

    await Location.startLocationUpdatesAsync(WORKER_BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: trackingProfile.accuracy,
      timeInterval: trackingProfile.timeIntervalMs,
      distanceInterval: trackingProfile.distanceIntervalMeters,
      pausesUpdatesAutomatically: true,
    });
  }, []);

  const stopTracking = useCallback(async () => {
    log('stopTracking:start');
    await Promise.allSettled([
      stopForegroundWatch(),
      stopBackgroundWatch(),
    ]);
    clearHeartbeat();

    isTrackingRef.current = false;
    setState(current => ({ ...current, isTracking: false }));
    log('stopTracking:done');
  }, [clearHeartbeat, stopBackgroundWatch, stopForegroundWatch]);

  const startTracking = useCallback(async () => {
    log('startTracking:start', {
      isOnline: isOnlineRef.current,
      workerId: workerIdRef.current,
      activeBookingId: activeBookingIdRef.current,
      enableBackground: ENABLE_BACKGROUND_LOCATION_TRACKING,
    });
    if (!isOnlineRef.current) {
      setError('Worker must be online before tracking starts.');
      log('startTracking:blocked-not-online');
      return false;
    }

    const workerIdValue = workerIdRef.current;
    if (!workerIdValue) {
      setError('Cannot start tracking without workerId.');
      log('startTracking:blocked-missing-worker-id');
      return false;
    }

    try {
      if (ENABLE_BACKGROUND_LOCATION_TRACKING) {
        log('startTracking:request-background-permission');
        const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
        log('startTracking:background-permission-result', {
          status: backgroundPermission.status,
        });
        if (backgroundPermission.status === Location.PermissionStatus.GRANTED) {
          await startBackgroundWatch();
          isTrackingRef.current = true;
          setState(current => ({ ...current, isTracking: true }));
          startHeartbeat();
          setError(null);
          return true;
        }
        log('startTracking:backgroundPermissionDenied', backgroundPermission.status);
      }

      await startForegroundWatch();
      isTrackingRef.current = true;
      setState(current => ({ ...current, isTracking: true }));
      startHeartbeat();
      setError(null);
      log('startTracking:foreground-started');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start tracking.';
      setError(message);
      log('startTracking:error', error);
      return false;
    }
  }, [log, setError, startBackgroundWatch, startForegroundWatch, startHeartbeat]);

  const goOnline = useCallback(async () => {
    trace('WL-01', 'goOnline:start');
    let workerIdValue = workerIdRef.current;
    if (!workerIdValue) {
      const userIdFromClaim = await getFirebaseLiveLocationUserIdClaim();
      if (userIdFromClaim) {
        workerIdRef.current = userIdFromClaim;
        workerIdValue = userIdFromClaim;
        trace('WL-01A', 'goOnline:resolved-user-id-from-claim', {
          userIdFromClaim,
        });
        log('goOnline:resolved-user-id-from-firebase-claim', {
          userIdFromClaim,
        });
      }
    }
    log('goOnline:start', {
      workerId: workerIdValue,
      currentAppState: appStateRef.current,
      activeBookingId: activeBookingIdRef.current,
    });
    if (!workerIdValue) {
      setError('workerId is required before Go Online.');
      trace('WL-01E', 'goOnline:blocked-missing-user-id');
      log('goOnline:blocked-missing-worker-id');
      return false;
    }

    try {
      trace('WL-02', 'goOnline:request-foreground-permission');
      log('goOnline:request-foreground-permission');
      const permissionResponse = await Location.requestForegroundPermissionsAsync();
      setState(current => ({ ...current, permissionStatus: permissionResponse.status }));
      trace('WL-03', 'goOnline:foreground-permission-result', {
        status: permissionResponse.status,
      });
      log('goOnline:foreground-permission-result', {
        status: permissionResponse.status,
        canAskAgain: permissionResponse.canAskAgain,
      });

      if (permissionResponse.status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission denied.');
        trace('WL-03E', 'goOnline:permission-denied');
        log('goOnline:blocked-permission-denied');
        return false;
      }

      if (!canWriteRealtimeData()) {
        trace('WL-04E', 'goOnline:blocked-cannot-write-realtime');
        log('goOnline:blocked-cannot-write-realtime');
        return false;
      }

      const nextIsAvailable = activeBookingIdRef.current == null;
      isOnlineRef.current = true;
      isAvailableRef.current = nextIsAvailable;
      const initialLocation = await refreshCurrentLocation();
      if (!initialLocation) {
        trace('WL-06E', 'goOnline:initial-location-write-failed');
        throw new Error('Initial live location write failed.');
      }
      trace('WL-06', 'goOnline:refresh-current-location-done');

      await registerWorkerLiveOnDisconnect(workerIdValue).update({
        userId: workerIdValue,
        isTrackable: false,
        isAvailable: false,
        activeBookingId: null,
        appState: 'BACKGROUND',
        heartbeatAt: getRealtimeServerTimestamp(),
        disconnectedAt: getRealtimeServerTimestamp(),
      });
      trace('WL-05', 'goOnline:onDisconnect-registered', {
        path: `user-live-location/${workerIdValue}`,
      });
      log('goOnline:onDisconnect-registered', {
        workerId: workerIdValue,
      });

      await startTracking();
      trace('WL-10', 'goOnline:tracking-started');
      setState(current => ({
        ...current,
        isOnline: true,
        isAvailable: nextIsAvailable,
      }));

      backgroundRuntimeContext.workerId = workerIdValue;
      backgroundRuntimeContext.activeBookingId = activeBookingIdRef.current;
      backgroundRuntimeContext.isAvailable = nextIsAvailable;
      backgroundRuntimeContext.appState = appStateRef.current;

      setError(null);
      trace('WL-11', 'goOnline:success');
      log('goOnline:success', {
        workerId: workerIdValue,
        isAvailable: nextIsAvailable,
      });
      return true;
    } catch (error) {
      trace('WL-XX', 'goOnline:error', {
        message: error instanceof Error ? error.message : String(error),
      });
      isOnlineRef.current = false;
      isAvailableRef.current = false;
      backgroundRuntimeContext.workerId = null;
      backgroundRuntimeContext.activeBookingId = null;
      backgroundRuntimeContext.isAvailable = false;
      setState(current => ({
        ...current,
        isOnline: false,
        isAvailable: false,
      }));
      const message = resolveRealtimeDatabaseErrorMessage(error, 'Unable to go online.');
      setError(message);
      log('goOnline:error', error);
      return false;
    }
  }, [canWriteRealtimeData, log, refreshCurrentLocation, setError, startTracking, trace]);

  const goOffline = useCallback(async () => {
    const workerIdValue = workerIdRef.current;
    log('goOffline:start', {
      workerId: workerIdValue,
      wasOnline: isOnlineRef.current,
    });

    await stopTracking();
    isOnlineRef.current = false;
    isAvailableRef.current = false;
    activeBookingIdRef.current = null;
    backgroundRuntimeContext.workerId = null;
    backgroundRuntimeContext.activeBookingId = null;
    backgroundRuntimeContext.isAvailable = false;
    lastSentLocationRef.current = null;

    setState(current => ({
      ...current,
      isOnline: false,
      isTracking: false,
      isAvailable: false,
      activeBookingId: null,
    }));

    if (!workerIdValue) return;

    try {
      if (!canWriteRealtimeData()) {
        log('goOffline:skip-cannot-write-realtime');
        return;
      }

      await registerWorkerLiveOnDisconnect(workerIdValue).cancel();
      if (REMOVE_WORKER_LIVE_NODE_ON_OFFLINE) {
        await removeWorkerLive(workerIdValue);
      } else {
        await updateWorkerLive(workerIdValue, {
          isTrackable: false,
          isAvailable: false,
          activeBookingId: null,
          appState: appStateRef.current,
          heartbeatAt: Date.now(),
        });
      }
      setError(null);
      log('goOffline:success', { workerId: workerIdValue });
    } catch (error) {
      const message = resolveRealtimeDatabaseErrorMessage(error, 'Failed to set worker offline.');
      setError(message);
      log('goOffline:error', error);
    }
  }, [canWriteRealtimeData, log, setError, stopTracking]);

  const updateActiveBookingId = useCallback(async (bookingId: string | null) => {
    log('updateActiveBookingId:start', {
      bookingId,
      workerId: workerIdRef.current,
      isOnline: isOnlineRef.current,
    });
    activeBookingIdRef.current = bookingId;
    isAvailableRef.current = bookingId == null && isOnlineRef.current;
    backgroundRuntimeContext.activeBookingId = bookingId;
    backgroundRuntimeContext.isAvailable = isAvailableRef.current;

    setState(current => ({
      ...current,
      activeBookingId: bookingId,
      isAvailable: isAvailableRef.current,
    }));

    const workerIdValue = workerIdRef.current;
    if (!workerIdValue || !isOnlineRef.current) {
      log('updateActiveBookingId:skip-not-online-or-no-worker-id');
      return;
    }

    if (!canWriteRealtimeData()) {
      log('updateActiveBookingId:skip-cannot-write-realtime');
      return;
    }

    try {
      await updateWorkerLive(workerIdValue, {
        activeBookingId: bookingId,
        isAvailable: isAvailableRef.current,
        heartbeatAt: Date.now(),
      });

      if (isTrackingRef.current) {
        await startTracking();
      }
    } catch (error) {
      const message = resolveRealtimeDatabaseErrorMessage(error, 'Unable to update active booking state.');
      setError(message);
      log('updateActiveBookingId:error', error);
    }
  }, [canWriteRealtimeData, log, setError, startTracking]);

  useEffect(() => {
    workerIdRef.current = workerId ?? null;
  }, [workerId]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      const nextWorkerState = toWorkerLiveAppState(nextAppState);
      appStateRef.current = nextWorkerState;
      backgroundRuntimeContext.appState = nextWorkerState;
      setState(current => ({ ...current, appState: nextWorkerState }));

      const workerIdValue = workerIdRef.current;
      if (!workerIdValue || !isOnlineRef.current) return;

      if (!canWriteRealtimeData()) {
        return;
      }

      void updateWorkerLive(workerIdValue, {
        appState: nextWorkerState,
        heartbeatAt: Date.now(),
      }).catch(error => {
        if (isFirebaseSessionError(error)) {
          markFirebaseReauthRequired();
        }
        log('appState:updateError', error);
      });

      if (nextWorkerState === 'FOREGROUND') {
        void refreshCurrentLocation();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [canWriteRealtimeData, log, refreshCurrentLocation]);

  useEffect(() => () => {
    void stopTracking();
  }, [stopTracking]);

  return useMemo(() => ({
    ...state,
    goOnline,
    goOffline,
    startTracking,
    stopTracking,
    updateActiveBookingId,
    refreshCurrentLocation,
  }), [
    goOffline,
    goOnline,
    refreshCurrentLocation,
    startTracking,
    state,
    stopTracking,
    updateActiveBookingId,
  ]);
}
