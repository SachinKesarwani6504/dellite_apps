import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthStatus } from '@/types/auth-status';

export function useAuth() {
  const auth = useAuthContext();

  return useMemo(() => ({
    ...auth,
    isBootstrapping: auth.status === AuthStatus.BOOTSTRAPPING,
    isLoggedOut: auth.status === AuthStatus.LOGGED_OUT,
    isPhoneVerified: auth.status === AuthStatus.PHONE_VERIFIED,
    isInOnboarding: auth.status === AuthStatus.ONBOARDING,
  }), [auth]);
}
