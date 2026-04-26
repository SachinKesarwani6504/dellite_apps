import { Auth, getAuth } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/firebaseApp';
import { assertFirebaseConfig, firebaseConfig, isFirebaseConfigured, missingFirebaseConfigKeys } from '@/lib/firebase/firebaseConfig';

let firebaseAuthInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (firebaseAuthInstance) {
    return firebaseAuthInstance;
  }

  firebaseAuthInstance = getAuth(getFirebaseApp());
  return firebaseAuthInstance;
}

export {
  assertFirebaseConfig,
  firebaseConfig,
  getFirebaseApp,
  isFirebaseConfigured,
  missingFirebaseConfigKeys,
};

