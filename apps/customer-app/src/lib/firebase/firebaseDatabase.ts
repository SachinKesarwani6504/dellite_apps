import { Database, DataSnapshot, getDatabase, onValue, ref } from 'firebase/database';
import { getFirebaseApp } from '@/lib/firebase/firebaseApp';
import type { WorkerLiveLocationRecord } from '@/types/worker-live-location';

export const LIVE_LOCATION_NAMESPACE = {
  WORKER: 'workerLive',
  CUSTOMER: 'customerLive',
} as const;

export type LiveLocationNamespace = (typeof LIVE_LOCATION_NAMESPACE)[keyof typeof LIVE_LOCATION_NAMESPACE];

let firebaseDatabaseInstance: Database | null = null;

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
