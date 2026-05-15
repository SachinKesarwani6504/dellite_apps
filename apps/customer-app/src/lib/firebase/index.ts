import { Auth, getAuth } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase/firebaseApp';
import { assertFirebaseConfig, firebaseConfig, isFirebaseConfigured, missingFirebaseConfigKeys } from '@/lib/firebase/firebaseConfig';
import {
  LIVE_LOCATION_NAMESPACE,
  getCustomerLivePath,
  getFirebaseDatabase,
  getLiveLocationPath,
  getWorkerLivePath,
  subscribeWorkerLiveLocation,
} from '@/lib/firebase/firebaseDatabase';

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
  getCustomerLivePath,
  getFirebaseDatabase,
  getLiveLocationPath,
  getWorkerLivePath,
  isFirebaseConfigured,
  LIVE_LOCATION_NAMESPACE,
  missingFirebaseConfigKeys,
  subscribeWorkerLiveLocation,
};
