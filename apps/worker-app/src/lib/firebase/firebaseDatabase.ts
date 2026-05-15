import {
  Database,
  OnDisconnect,
  getDatabase,
  onDisconnect,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { getFirebaseApp } from '@/lib/firebase/firebaseApp';

export const LIVE_LOCATION_NAMESPACE = {
  WORKER: 'workerLive',
  CUSTOMER: 'customerLive',
} as const;

export type LiveLocationNamespace = (typeof LIVE_LOCATION_NAMESPACE)[keyof typeof LIVE_LOCATION_NAMESPACE];

export type WorkerLiveAppState = 'FOREGROUND' | 'BACKGROUND' | 'INACTIVE';
export type WorkerVehicleMode =
  | 'WALK'
  | 'CYCLE'
  | 'TWO_WHEELER'
  | 'CAR'
  | 'UNKNOWN';

export type WorkerLiveLocationRecord = {
  workerId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  lastLocationAt: number;
  heartbeatAt: number;
  isAvailable: boolean;
  isTrackable: boolean;
  vehicleMode: WorkerVehicleMode;
  appState: WorkerLiveAppState;
};

export type WorkerLiveUpdatePayload = Partial<WorkerLiveLocationRecord> & Record<string, unknown>;

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

export function registerWorkerLiveOnDisconnect(workerId: string): OnDisconnect {
  return onDisconnect(getWorkerLiveRef(workerId));
}

export async function removeWorkerLive(workerId: string) {
  await remove(getWorkerLiveRef(workerId));
}

export function getRealtimeServerTimestamp() {
  return serverTimestamp();
}
