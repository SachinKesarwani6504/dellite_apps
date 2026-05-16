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
