import { useCallback } from 'react';

import type { UpdateCustomerIdentityPayload } from '@/types/customer';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { useEffect } from 'react';
import type { OnboardingRouteName } from '@/types/onboarding';

type UseOnboardingScreenGuardParams = {
  currentRoute: OnboardingRouteName;
  onRedirect: (route: OnboardingRouteName) => void;
  refreshOnMount?: boolean;
};

export function useOnboardingScreenGuard({
  currentRoute,
  onRedirect,
  refreshOnMount = false,
}: UseOnboardingScreenGuardParams) {
  const { getOnboardingRedirect, refreshOnboardingRoute } = useOnboardingContext();

  useEffect(() => {
    if (!refreshOnMount) return;
    void refreshOnboardingRoute()
      .then(route => {
        if (route !== currentRoute) {
          onRedirect(route);
        }
      })
      .catch(() => {
        // Existing onboarding route in context still guards the current screen.
      });
  }, [currentRoute, onRedirect, refreshOnMount, refreshOnboardingRoute]);

  useEffect(() => {
    const redirect = getOnboardingRedirect(currentRoute);
    if (redirect) {
      onRedirect(redirect);
    }
  }, [currentRoute, getOnboardingRedirect, onRedirect]);
}

export function useOnboarding() {
  const { authState, completeOnboarding } = useAuthContext();
  const { refreshOnboardingRoute } = useOnboardingContext();

  const syncOnboardingRoute = useCallback(async () => {
    return refreshOnboardingRoute();
  }, [refreshOnboardingRoute]);

  const submitIdentityAndResolve = useCallback(
    async (payload: UpdateCustomerIdentityPayload) => {
      await completeOnboarding(payload);
      const route = await refreshOnboardingRoute();
      return {
        route,
      };
    },
    [completeOnboarding, refreshOnboardingRoute],
  );

  return {
    authState,
    syncOnboardingRoute,
    submitIdentityAndResolve,
  };
}
