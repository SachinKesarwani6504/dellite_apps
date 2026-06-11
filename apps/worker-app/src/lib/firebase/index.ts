import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, Persistence, getAuth, initializeAuth } from 'firebase/auth';
import {
  DataSnapshot,
  Database,
  OnDisconnect,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import type { UserLiveEvent } from '@/types/live-notifications';
import type { UserPresence } from '@/types/rtdb';
import type { WorkerLiveLocationRecord } from '@/types/worker-live-location';

export type FirebaseRuntimeConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export const ENABLE_BACKGROUND_LOCATION_TRACKING = false;
export const REMOVE_WORKER_LIVE_NODE_ON_OFFLINE = false;
export const WORKER_BACKGROUND_LOCATION_TASK_NAME = 'WORKER_LIVE_LOCATION_TASK';

export const LIVE_LOCATION_NAMESPACE = {
  WORKER: 'workerLive',
  CUSTOMER: 'customerLive',
} as const;

export type LiveLocationNamespace = (typeof LIVE_LOCATION_NAMESPACE)[keyof typeof LIVE_LOCATION_NAMESPACE];
export type { WorkerLiveLocationRecord };
export type { WorkerVehicleMode, WorkerMovementStatus } from '@/types/worker-live-location';

export type WorkerLiveUpdatePayload = Partial<WorkerLiveLocationRecord>;

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let firebaseDatabaseInstance: Database | null = null;
let firebaseStorageInstance: FirebaseStorage | null = null;
let firebaseFirestoreInstance: Firestore | null = null;

function readEnvValue(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

function normalizeDatabaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export const firebaseConfig: FirebaseRuntimeConfig = {
  apiKey: readEnvValue('EXPO_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY'),
  authDomain: readEnvValue('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'),
  databaseURL: normalizeDatabaseUrl(readEnvValue('EXPO_PUBLIC_FIREBASE_DATABASE_URL', 'FIREBASE_DATABASE_URL')),
  projectId: readEnvValue('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'),
  storageBucket: readEnvValue('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnvValue('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnvValue('EXPO_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_APP_ID'),
  measurementId: readEnvValue('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', 'FIREBASE_MEASUREMENT_ID') || undefined,
};

const REQUIRED_FIREBASE_CONFIG_KEYS: ReadonlyArray<keyof FirebaseRuntimeConfig> = [
  'apiKey',
  'authDomain',
  'databaseURL',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

export const missingFirebaseConfigKeys = REQUIRED_FIREBASE_CONFIG_KEYS.filter(
  key => !firebaseConfig[key],
);

export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;

export function assertFirebaseConfig() {
  if (isFirebaseConfigured) return;
  throw new Error(
    `[firebase-config] Missing firebase env keys: ${missingFirebaseConfigKeys.join(', ')}. Provide EXPO_PUBLIC_FIREBASE_* (preferred) or FIREBASE_* values.`,
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (firebaseAppInstance) {
    return firebaseAppInstance;
  }

  assertFirebaseConfig();
  firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return firebaseAppInstance;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuthInstance) {
    return firebaseAuthInstance;
  }

  const app = getFirebaseApp();
  try {
    const getReactNativePersistence = (FirebaseAuth as unknown as {
      getReactNativePersistence?: (
        storage: typeof ReactNativeAsyncStorage,
      ) => unknown;
    }).getReactNativePersistence;

    if (typeof getReactNativePersistence !== 'function') {
      throw new Error('React Native persistence helper not available in current firebase/auth export.');
    }

    firebaseAuthInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage) as Persistence,
    });
  } catch {
    firebaseAuthInstance = getAuth(app);
  }
  return firebaseAuthInstance;
}

export function getFirebaseDatabase(): Database {
  if (firebaseDatabaseInstance) {
    return firebaseDatabaseInstance;
  }

  firebaseDatabaseInstance = getDatabase(getFirebaseApp());
  return firebaseDatabaseInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (firebaseStorageInstance) {
    return firebaseStorageInstance;
  }

  firebaseStorageInstance = getStorage(getFirebaseApp());
  return firebaseStorageInstance;
}

export function getFirebaseFirestore(): Firestore {
  if (firebaseFirestoreInstance) {
    return firebaseFirestoreInstance;
  }

  firebaseFirestoreInstance = getFirestore(getFirebaseApp());
  return firebaseFirestoreInstance;
}

// Placeholder for future analytics integration with RN-supported tooling.
export function getFirebaseAnalyticsIfSupported() {
  return null;
}

export function getLiveLocationPath(namespace: LiveLocationNamespace, userId: string) {
  return `${namespace}/${userId}`;
}

export function getWorkerLivePath(userId: string) {
  return getLiveLocationPath(LIVE_LOCATION_NAMESPACE.WORKER, userId);
}

export function getCustomerLivePath(userId: string) {
  return getLiveLocationPath(LIVE_LOCATION_NAMESPACE.CUSTOMER, userId);
}

export function getUserPresencePath(userId: string) {
  return `userPresence/${userId}`;
}

export function getUserLiveEventsPath(userId: string) {
  return `userLiveEvents/${userId}`;
}

export function getUserLiveEventPath(userId: string, eventId: string) {
  return `${getUserLiveEventsPath(userId)}/${eventId}`;
}

export function getUserPresenceRef(userId: string) {
  return ref(getFirebaseDatabase(), getUserPresencePath(userId));
}

export function getUserLiveEventsRef(userId: string) {
  return ref(getFirebaseDatabase(), getUserLiveEventsPath(userId));
}

export function getUserLiveEventRef(userId: string, eventId: string) {
  return ref(getFirebaseDatabase(), getUserLiveEventPath(userId, eventId));
}

export function getWorkerLiveRef(userId: string) {
  return ref(getFirebaseDatabase(), getWorkerLivePath(userId));
}

export function getCustomerLiveRef(userId: string) {
  return ref(getFirebaseDatabase(), getCustomerLivePath(userId));
}

export async function setWorkerLive(workerId: string, payload: WorkerLiveLocationRecord) {
  await set(getWorkerLiveRef(workerId), payload);
}

export async function updateWorkerLive(workerId: string, payload: WorkerLiveUpdatePayload) {
  await update(getWorkerLiveRef(workerId), payload);
}

export async function updateUserPresence(userId: string, payload: UserPresence) {
  await update(getUserPresenceRef(userId), payload);
}

export async function removeUserLiveEvent(userId: string, eventId: string) {
  await remove(getUserLiveEventRef(userId, eventId));
}

export function registerWorkerLiveOnDisconnect(workerId: string): OnDisconnect {
  return onDisconnect(getWorkerLiveRef(workerId));
}

export function registerUserPresenceOnDisconnect(userId: string): OnDisconnect {
  return onDisconnect(getUserPresenceRef(userId));
}

export async function removeWorkerLive(workerId: string) {
  await remove(getWorkerLiveRef(workerId));
}

export function getRealtimeServerTimestamp() {
  return serverTimestamp();
}

export function subscribeWorkerLiveLocation(
  workerId: string,
  onLocation: (location: WorkerLiveLocationRecord | null) => void,
  onError: (error: Error) => void,
) {
  return onValue(
    getWorkerLiveRef(workerId),
    (snapshot: DataSnapshot) => {
      onLocation(snapshot.exists() ? (snapshot.val() as WorkerLiveLocationRecord) : null);
    },
    onError,
  );
}

export function subscribeUserLiveEvents(
  userId: string,
  onEvent: (event: UserLiveEvent | null) => void,
  onError: (error: Error) => void,
) {
  return onValue(
    getUserLiveEventsRef(userId),
    (snapshot: DataSnapshot) => {
      onEvent(snapshot.exists() ? (snapshot.val() as UserLiveEvent) : null);
    },
    onError,
  );
}
