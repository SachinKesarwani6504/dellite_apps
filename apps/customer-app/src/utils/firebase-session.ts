import { signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

export function hasFirebaseAuthenticatedUser() {
  try {
    return Boolean(getFirebaseAuth().currentUser);
  } catch {
    return false;
  }
}

export async function resolveFirebasePresenceUserId(fallbackUserId?: string | null) {
  const fallback = typeof fallbackUserId === 'string' && fallbackUserId.trim().length > 0
    ? fallbackUserId.trim()
    : null;

  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      return fallback;
    }

    const tokenResult = await user.getIdTokenResult(false);
    const claims = tokenResult.claims as Record<string, unknown>;
    const candidates = [
      claims.user_uuid,
      claims.userId,
      claims.user_id,
      claims.id,
      user.uid,
      claims.sub,
      fallback,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  } catch {
    // Fall through to backend user id when Firebase token claims are unavailable.
  }

  return fallback;
}

export async function applyFirebaseCustomToken(firebaseCustomToken?: string | null) {
  const normalizedToken = typeof firebaseCustomToken === 'string' ? firebaseCustomToken.trim() : '';
  if (!normalizedToken) {
    return false;
  }

  try {
    await signInWithCustomToken(getFirebaseAuth(), normalizedToken);
    return true;
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[firebase-session][customer] custom-token exchange failed', error);
    }
    return false;
  }
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
