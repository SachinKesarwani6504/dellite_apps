# Firebase Integration

## Overview

Firebase is used for:

- **Authentication**: Phone-based auth
- **Analytics**: User events and funnels
- **Realtime Database**: Job updates, notifications
- **Cloud Storage**: User photos, documents
- **Cloud Messaging**: Push notifications
- **Crashlytics**: Error tracking

## Directory Structure

```
src/lib/firebase/
├── index.ts                 # Main Firebase init
├── auth.ts                  # Authentication helpers
├── analytics.ts             # Analytics events
├── database.ts              # Realtime database
├── storage.ts               # Cloud storage
└── messaging.ts             # Push notifications
```

## Firebase Initialization

```typescript
// src/lib/firebase/index.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = initializeApp(FIREBASE_CONFIG);

export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
```

## Analytics Events

```typescript
// src/lib/firebase/analytics.ts
import { logEvent } from 'firebase/analytics';
import { analytics } from './index';

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  logEvent(analytics, eventName, eventParams);
};

export const EVENTS = {
  // Auth
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Booking (Customer)
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_CANCELLED: 'booking_cancelled',
  
  // Jobs (Worker)
  JOB_ACCEPTED: 'job_accepted',
  JOB_COMPLETED: 'job_completed',
  JOB_CANCELLED: 'job_cancelled',
  
  // General
  SCREEN_VIEWED: 'screen_viewed',
  ERROR_OCCURRED: 'error_occurred',
};
```

Usage:

```typescript
import { trackEvent, EVENTS } from '../lib/firebase/analytics';

// Track booking
trackEvent(EVENTS.BOOKING_COMPLETED, {
  bookingId: booking.id,
  totalPrice: booking.price,
  workerRating: 4.5,
});
```

## Realtime Database

```typescript
// src/lib/firebase/database.ts
import { ref, get, set, update, onValue } from 'firebase/database';
import { database } from './index';

export const dbRef = (path: string) => ref(database, path);

export async function fetchData(path: string) {
  const snapshot = await get(dbRef(path));
  return snapshot.val();
}

export async function saveData(path: string, data: any) {
  await set(dbRef(path), data);
}

export async function updateData(path: string, updates: Record<string, any>) {
  await update(dbRef(path), updates);
}

export function listenToData(path: string, callback: (data: any) => void) {
  const unsubscribe = onValue(dbRef(path), (snapshot) => {
    callback(snapshot.val());
  });
  return unsubscribe;
}
```

## Cloud Storage

```typescript
// src/lib/firebase/storage.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './index';

export async function uploadFile(path: string, file: Blob): Promise<string> {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function deleteFile(path: string): Promise<void> {
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}
```

## Cloud Messaging

```typescript
// src/lib/firebase/messaging.ts
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './index';

export async function getFCMToken(): Promise<string> {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.EXPO_PUBLIC_FCM_VAPID_KEY,
    });
    return token;
  } catch (error) {
    console.error('FCM token error:', error);
    throw error;
  }
}

export function setupMessageListener(callback: (message: any) => void) {
  return onMessage(messaging, (message) => {
    callback(message);
    // Show notification to user
  });
}
```

## Integration with Dellite Auth

```typescript
// src/hooks/useAuthController.ts
import { getFCMToken } from '../lib/firebase/messaging';

export function useAuthController() {
  const login = async (phone: string, password: string) => {
    try {
      // Login with backend
      const response = await authActions.login({ phone, password });
      
      // Get FCM token and register with backend
      const fcmToken = await getFCMToken();
      await authActions.registerFCMToken(fcmToken);
      
      // Setup message listener
      setupMessageListener((message) => {
        handleNotification(message);
      });
      
      setUser(response.user);
      setTokens(response.tokens);
    } catch (error) {
      showApiErrorToast(error);
      throw error;
    }
  };

  return { login };
}
```

## Environment Variables

Create `.env` file (example):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDxxx...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=dellite.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=dellite-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=dellite-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abc123...
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://dellite-prod.firebaseio.com
EXPO_PUBLIC_FCM_VAPID_KEY=abc123...
```

## Testing Firebase

```typescript
// Use Firebase emulator in development
import { connectAuthEmulator } from 'firebase/auth';

if (__DEV__) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (e) {
    // Emulator already connected
  }
}
```

## Rules

- All Firebase calls go through `src/lib/firebase/*`
- Use typed wrappers (no direct Firebase imports in screens)
- Environment variables for all secrets
- Separate FCM token registration from user authentication

## Related Documentation

- **Authentication**: How auth tokens work → [/docs/flows/auth-flow.md](../flows/auth-flow.md)
- **Deployment**: Firebase config per environment → [/docs/deployment](../deployment/index.md)
