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

function readEnvValue(key: string): string {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDatabaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export const firebaseConfig: FirebaseRuntimeConfig = {
  apiKey: readEnvValue('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnvValue('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  databaseURL: normalizeDatabaseUrl(readEnvValue('EXPO_PUBLIC_FIREBASE_DATABASE_URL')),
  projectId: readEnvValue('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnvValue('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnvValue('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnvValue('EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: readEnvValue('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID') || undefined,
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
    `[firebase-config] Missing EXPO_PUBLIC firebase env keys: ${missingFirebaseConfigKeys.join(', ')}`,
  );
}
