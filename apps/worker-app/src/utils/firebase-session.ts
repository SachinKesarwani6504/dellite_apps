import { signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

let firebaseReauthRequired = false;
const FIREBASE_SESSION_DEBUG = false;

function trace(step: string, message: string, payload?: unknown) {
  if (!FIREBASE_SESSION_DEBUG || !__DEV__) return;
  void step;
  void message;
  void payload;
}

export function hasFirebaseAuthenticatedUser() {
  try {
    return Boolean(getFirebaseAuth().currentUser);
  } catch {
    return false;
  }
}

export async function getFirebaseSessionDebugSnapshot() {
  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) {
      return {
        hasCurrentUser: false,
        currentUid: null,
        claims: null,
      };
    }

    const tokenResult = await user.getIdTokenResult(false);
    return {
      hasCurrentUser: true,
      currentUid: user.uid,
      claims: tokenResult.claims ?? null,
      issuedAtTime: tokenResult.issuedAtTime,
      expirationTime: tokenResult.expirationTime,
      authTime: tokenResult.authTime,
      signInProvider: tokenResult.signInProvider ?? null,
    };
  } catch (error) {
    return {
      hasCurrentUser: false,
      currentUid: null,
      claims: null,
      debugError: error instanceof Error ? error.message : 'Unable to read Firebase token result.',
    };
  }
}

export async function getFirebaseLiveLocationUserIdClaim(): Promise<string | null> {
  const snapshot = await getFirebaseSessionDebugSnapshot();
  if (!snapshot.hasCurrentUser || !snapshot.claims || typeof snapshot.claims !== 'object') {
    return null;
  }

  const claims = snapshot.claims as Record<string, unknown>;
  const candidates = [
    claims.user_uuid,
    claims.user_id,
    claims.sub,
    claims.worker_id,
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

export async function ensureFirebaseSessionWithCustomToken(
  firebaseCustomToken?: string | null,
  options?: { forceReauth?: boolean },
) {
  const normalizedToken = typeof firebaseCustomToken === 'string' ? firebaseCustomToken.trim() : '';
  trace('FS-01', 'ensure:start', {
    hasToken: normalizedToken.length > 0,
    forceReauth: Boolean(options?.forceReauth),
  });
  if (FIREBASE_SESSION_DEBUG && __DEV__) {
    // eslint-disable-next-line no-console
    console.log('[firebase-session][worker] ensure:start', {
      hasToken: normalizedToken.length > 0,
      tokenLength: normalizedToken.length,
      forceReauth: Boolean(options?.forceReauth),
    });
  }
  if (!normalizedToken) {
    trace('FS-01E', 'ensure:skip-empty-token');
    if (FIREBASE_SESSION_DEBUG && __DEV__) {
      // eslint-disable-next-line no-console
      console.log('[firebase-session][worker] ensure:skip-empty-token');
    }
    return false;
  }

  try {
    const auth = getFirebaseAuth();
    trace('FS-02', 'ensure:before-signin', {
      hasCurrentUser: Boolean(auth.currentUser),
      currentUid: auth.currentUser?.uid ?? null,
    });
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[firebase-session][worker] ensure:before-signin', {
        hasCurrentUser: Boolean(auth.currentUser),
        currentUid: auth.currentUser?.uid ?? null,
      });
    }
    if (!options?.forceReauth && auth.currentUser) {
      if (FIREBASE_SESSION_DEBUG && __DEV__) {
        // eslint-disable-next-line no-console
        console.log('[firebase-session][worker] ensure:skip-existing-session', {
          currentUid: auth.currentUser.uid,
        });
      }
      return true;
    }

    await signInWithCustomToken(auth, normalizedToken);
    firebaseReauthRequired = false;
    trace('FS-03', 'ensure:signin-success', {
      currentUid: auth.currentUser?.uid ?? null,
    });
    if (FIREBASE_SESSION_DEBUG && __DEV__) {
      // eslint-disable-next-line no-console
      console.log('[firebase-session][worker] ensure:signin-success', {
        hasCurrentUser: Boolean(auth.currentUser),
        currentUid: auth.currentUser?.uid ?? null,
      });
      const tokenResult = await auth.currentUser?.getIdTokenResult(false);
      // eslint-disable-next-line no-console
      console.log('[firebase-session][worker] ensure:signin-token-claims', {
        claims: tokenResult?.claims ?? null,
        signInProvider: tokenResult?.signInProvider ?? null,
        issuedAtTime: tokenResult?.issuedAtTime ?? null,
        expirationTime: tokenResult?.expirationTime ?? null,
      });
    }
    return true;
  } catch (error) {
    trace('FS-XX', 'ensure:signin-failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    const firebaseErrorCode = typeof (error as { code?: unknown })?.code === 'string'
      ? (error as { code?: string }).code ?? ''
      : '';
    if (FIREBASE_SESSION_DEBUG && __DEV__) {
      // eslint-disable-next-line no-console
      console.log('[firebase-session][worker] custom-token exchange failed', error);
      if (firebaseErrorCode.includes('auth/configuration-not-found')) {
        // eslint-disable-next-line no-console
        console.log(
          '[firebase-session][worker] Enable Firebase Authentication for project and verify EXPO_PUBLIC firebase config values (apiKey/projectId/appId/authDomain).',
        );
      }
    }
    return false;
  }
}

export function markFirebaseReauthRequired() {
  firebaseReauthRequired = true;
}

export function shouldForceFirebaseReauth() {
  return firebaseReauthRequired;
}

export function isFirebaseSessionError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const message = typeof (error as { message?: unknown }).message === 'string'
    ? ((error as { message?: string }).message ?? '').toLowerCase()
    : '';
  const code = typeof (error as { code?: unknown }).code === 'string'
    ? ((error as { code?: string }).code ?? '').toLowerCase()
    : '';

  return code.includes('permission-denied')
    || code.includes('permission_denied')
    || code.includes('auth/invalid-user-token')
    || code.includes('auth/id-token-expired')
    || code.includes('auth/user-token-expired')
    || message.includes('permission_denied')
    || message.includes('auth/invalid-user-token')
    || message.includes('auth/id-token-expired')
    || message.includes('auth/user-token-expired');
}

export async function clearFirebaseAuthSession() {
  try {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch {
    // Ignore Firebase sign-out errors during local session cleanup.
  }
}
