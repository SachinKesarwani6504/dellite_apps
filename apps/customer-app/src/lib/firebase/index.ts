import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, Persistence, getAuth, initializeAuth } from 'firebase/auth';
import { Database, DataSnapshot, getDatabase, onValue, ref } from 'firebase/database';
import type { WorkerLiveLocationRecord } from '@/types/worker-live-location';
import { ENV } from '@/utils/env';

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

export const LIVE_LOCATION_NAMESPACE = {
  WORKER: 'workerLive',
  CUSTOMER: 'customerLive',
} as const;

export type LiveLocationNamespace = (typeof LIVE_LOCATION_NAMESPACE)[keyof typeof LIVE_LOCATION_NAMESPACE];

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let firebaseDatabaseInstance: Database | null = null;

function normalizeDatabaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export const firebaseConfig: FirebaseRuntimeConfig = {
  apiKey: ENV.FIREBASE_API_KEY ?? '',
  authDomain: ENV.FIREBASE_AUTH_DOMAIN ?? '',
  databaseURL: normalizeDatabaseUrl(ENV.FIREBASE_DATABASE_URL ?? ''),
  projectId: ENV.FIREBASE_PROJECT_ID ?? '',
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: ENV.FIREBASE_APP_ID ?? '',
  measurementId: ENV.FIREBASE_MEASUREMENT_ID || undefined,
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

export function getLiveLocationPath(namespace: LiveLocationNamespace, userId: string) {
  return `${namespace}/${userId}`;
}

export function getWorkerLivePath(userId: string) {
  return getLiveLocationPath(LIVE_LOCATION_NAMESPACE.WORKER, userId);
}

export function getCustomerLivePath(userId: string) {
  return getLiveLocationPath(LIVE_LOCATION_NAMESPACE.CUSTOMER, userId);
}

export function subscribeWorkerLiveLocation(
  workerId: string,
  onLocation: (location: WorkerLiveLocationRecord | null) => void,
  onError: (error: Error) => void,
) {
  const workerLiveRef = ref(getFirebaseDatabase(), getWorkerLivePath(workerId));
  return onValue(
    workerLiveRef,
    (snapshot: DataSnapshot) => {
      onLocation(snapshot.exists() ? (snapshot.val() as WorkerLiveLocationRecord) : null);
    },
    onError,
  );
}
