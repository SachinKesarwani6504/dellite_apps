import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, Persistence, getAuth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import {
  ENABLE_BACKGROUND_LOCATION_TRACKING,
  REMOVE_WORKER_LIVE_NODE_ON_OFFLINE,
  WORKER_BACKGROUND_LOCATION_TASK_NAME,
} from '@/lib/firebase/constants';
import { getFirebaseApp } from '@/lib/firebase/firebaseApp';
import {
  WorkerLiveAppState,
  WorkerLiveLocationRecord,
  WorkerLiveUpdatePayload,
  getFirebaseDatabase,
  getRealtimeServerTimestamp,
  getWorkerLiveRef,
  registerWorkerLiveOnDisconnect,
  removeWorkerLive,
  setWorkerLive,
  updateWorkerLive,
} from '@/lib/firebase/firebaseDatabase';
import { assertFirebaseConfig, firebaseConfig, isFirebaseConfigured, missingFirebaseConfigKeys } from '@/lib/firebase/firebaseConfig';

let firebaseAuthInstance: Auth | null = null;
let firebaseStorageInstance: FirebaseStorage | null = null;
let firebaseFirestoreInstance: Firestore | null = null;

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

export {
  ENABLE_BACKGROUND_LOCATION_TRACKING,
  REMOVE_WORKER_LIVE_NODE_ON_OFFLINE,
  WORKER_BACKGROUND_LOCATION_TASK_NAME,
  assertFirebaseConfig,
  firebaseConfig,
  getFirebaseApp,
  getFirebaseDatabase,
  getRealtimeServerTimestamp,
  getWorkerLiveRef,
  isFirebaseConfigured,
  missingFirebaseConfigKeys,
  registerWorkerLiveOnDisconnect,
  removeWorkerLive,
  setWorkerLive,
  updateWorkerLive,
};

export type { WorkerLiveAppState, WorkerLiveLocationRecord, WorkerLiveUpdatePayload };
