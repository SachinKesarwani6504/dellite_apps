import { signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

export function hasFirebaseAuthenticatedUser() {
  try {
    return Boolean(getFirebaseAuth().currentUser);
  } catch {
    return false;
  }
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

