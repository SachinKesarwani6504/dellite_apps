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

export type WorkerLiveAppState = 'FOREGROUND' | 'BACKGROUND';

export type WorkerLiveLocationRecord = {
  userId: string;
  lat: number;
  lng: number;
  accuracy: number;
  heading: number;
  speed: number;
  lastLocationAt: number;
  heartbeatAt: number;
  isAvailable: boolean;
  isTrackable: boolean;
  activeBookingId: string | null;
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

export function getWorkerLiveRef(userId: string) {
  return ref(getFirebaseDatabase(), `user-live-location/${userId}`);
}

export async function setWorkerLive(userId: string, payload: WorkerLiveLocationRecord) {
  await set(getWorkerLiveRef(userId), payload);
}

export async function updateWorkerLive(userId: string, payload: WorkerLiveUpdatePayload) {
  await update(getWorkerLiveRef(userId), payload);
}

export function registerWorkerLiveOnDisconnect(userId: string): OnDisconnect {
  return onDisconnect(getWorkerLiveRef(userId));
}

export async function removeWorkerLive(userId: string) {
  await remove(getWorkerLiveRef(userId));
}

export function getRealtimeServerTimestamp() {
  return serverTimestamp();
}
