import { useCallback } from 'react';

import { AUTH_STATUS } from '@/types/auth';
import type { UpdateCustomerIdentityPayload } from '@/types/customer';
import { useAuthContext } from '@/contexts/AuthContext';

export function useOnboarding() {
  const { authState, refreshMe, completeOnboarding } = useAuthContext();

  const syncOnboardingRoute = useCallback(async () => {
    return refreshMe();
  }, [refreshMe]);

  const submitIdentityAndResolve = useCallback(
    async (payload: UpdateCustomerIdentityPayload) => {
      await completeOnboarding(payload);
      const status = await refreshMe();
      return {
        status,
        shouldEnterMainTabs: status === AUTH_STATUS.AUTHENTICATED,
      };
    },
    [completeOnboarding, refreshMe],
  );

  return {
    authState,
    syncOnboardingRoute,
    submitIdentityAndResolve,
  };
}
