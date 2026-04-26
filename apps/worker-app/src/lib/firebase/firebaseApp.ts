import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { assertFirebaseConfig, firebaseConfig } from '@/lib/firebase/firebaseConfig';

let firebaseAppInstance: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseAppInstance) {
    return firebaseAppInstance;
  }

  assertFirebaseConfig();
  firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return firebaseAppInstance;
}

