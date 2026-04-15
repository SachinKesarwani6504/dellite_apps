import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { AUTH_STATUS, AuthStatus } from '@/types/auth';
import type { OnboardingContextType } from '@/types/onboarding-context';
import type { OnboardingCurrentStep, OnboardingRouteName } from '@/types/onboarding';
import { ONBOARDING_SCREEN } from '@/types/screen-names';
import { resolveCustomerOnboarding } from '@/utils/customer-onboarding';

function resolveInitialRoute(status: AuthStatus): OnboardingRouteName {
  return status === AUTH_STATUS.POST_ONBOARDING_WELCOME
    ? ONBOARDING_SCREEN.CUSTOMER_WELCOME
    : ONBOARDING_SCREEN.CUSTOMER_IDENTITY;
}

export function useOnboardingController(): OnboardingContextType {
  const { authState, refreshMe, completeWelcomeAndEnterMainTabs } = useAuthContext();
  const [localWelcomeSeen, setLocalWelcomeSeen] = useState(false);
  const [onboardingRoute, setOnboardingRoute] = useState<OnboardingRouteName>(() => {
    if (authState.user) {
      return resolveCustomerOnboarding(authState.user).route;
    }
    return resolveInitialRoute(authState.status);
  });
  const [isOnboardingActive, setIsOnboardingActive] = useState<boolean>(() => {
    if (authState.user) {
      return !resolveCustomerOnboarding(authState.user).isComplete;
    }
    return authState.status === AUTH_STATUS.ONBOARDING || authState.status === AUTH_STATUS.POST_ONBOARDING_WELCOME;
  });
  const [loading, setLoading] = useState(true);

  const resolveRouteFromStatus = useCallback((status: AuthStatus): OnboardingRouteName => {
    return resolveInitialRoute(status);
  }, []);

  const applyUserSnapshot = useCallback((forceWelcomeSeen = false) => {
    const baseUser = authState.user;
    const mergedUser = forceWelcomeSeen && baseUser
      ? {
        ...baseUser,
        hasSeenOnboardingWelcomeScreen: true,
        onboarding: {
          ...(baseUser.onboarding ?? {}),
          hasSeenOnboardingWelcomeScreen: true,
        },
      }
      : baseUser;

    const next = resolveCustomerOnboarding(mergedUser);
    setOnboardingRoute(next.route);
    setIsOnboardingActive(!next.isComplete);
    return next.route;
  }, [authState.user]);

  const refreshOnboardingRoute = useCallback(async (): Promise<OnboardingRouteName> => {
    if (authState.status === AUTH_STATUS.LOGGED_OUT || authState.status === AUTH_STATUS.OTP_SENT) {
      setOnboardingRoute(ONBOARDING_SCREEN.CUSTOMER_IDENTITY);
      setIsOnboardingActive(false);
      return ONBOARDING_SCREEN.CUSTOMER_IDENTITY;
    }

    if (authState.status === AUTH_STATUS.ONBOARDING && !authState.tokens?.accessToken) {
      setOnboardingRoute(ONBOARDING_SCREEN.CUSTOMER_IDENTITY);
      setIsOnboardingActive(true);
      return ONBOARDING_SCREEN.CUSTOMER_IDENTITY;
    }

    if (authState.user) {
      return applyUserSnapshot(localWelcomeSeen);
    }

    setLoading(true);
    try {
      const status = await refreshMe();
      if (status === AUTH_STATUS.AUTHENTICATED) {
        setOnboardingRoute(ONBOARDING_SCREEN.CUSTOMER_WELCOME);
        setIsOnboardingActive(false);
        return ONBOARDING_SCREEN.CUSTOMER_WELCOME;
      }
      if (status === AUTH_STATUS.ONBOARDING || status === AUTH_STATUS.POST_ONBOARDING_WELCOME) {
        const route = resolveRouteFromStatus(status);
        setOnboardingRoute(route);
        setIsOnboardingActive(true);
        return route;
      }
      return applyUserSnapshot(localWelcomeSeen);
    } catch {
      setOnboardingRoute(ONBOARDING_SCREEN.CUSTOMER_IDENTITY);
      setIsOnboardingActive(true);
      return ONBOARDING_SCREEN.CUSTOMER_IDENTITY;
    } finally {
      setLoading(false);
    }
  }, [
    authState.status,
    authState.tokens?.accessToken,
    authState.user,
    applyUserSnapshot,
    localWelcomeSeen,
    refreshMe,
    resolveRouteFromStatus,
  ]);

  useEffect(() => {
    if (authState.status === AUTH_STATUS.BOOTSTRAPPING) {
      setLoading(true);
      return;
    }

    if (authState.status === AUTH_STATUS.LOGGED_OUT || authState.status === AUTH_STATUS.OTP_SENT) {
      setLocalWelcomeSeen(false);
      setOnboardingRoute(ONBOARDING_SCREEN.CUSTOMER_IDENTITY);
      setIsOnboardingActive(false);
      setLoading(false);
      return;
    }

    if (authState.status === AUTH_STATUS.ONBOARDING && !authState.tokens?.accessToken) {
      setOnboardingRoute(ONBOARDING_SCREEN.CUSTOMER_IDENTITY);
      setIsOnboardingActive(true);
      setLoading(false);
      return;
    }

    if (authState.user) {
      applyUserSnapshot(localWelcomeSeen);
      setLoading(false);
      return;
    }

    void refreshOnboardingRoute();
  }, [
    authState.status,
    authState.tokens?.accessToken,
    authState.user,
    applyUserSnapshot,
    localWelcomeSeen,
    refreshOnboardingRoute,
  ]);

  const getOnboardingRedirect = useCallback((currentRoute: OnboardingRouteName) => {
    if (!isOnboardingActive) return null;
    return onboardingRoute === currentRoute ? null : onboardingRoute;
  }, [isOnboardingActive, onboardingRoute]);

  const markOnboardingStepSeen = useCallback((step: OnboardingCurrentStep) => {
    if (step === 'IDENTITY') {
      setOnboardingRoute(ONBOARDING_SCREEN.CUSTOMER_WELCOME);
      setIsOnboardingActive(true);
      return;
    }
    if (step === 'WELCOME') {
      setLocalWelcomeSeen(true);
      setIsOnboardingActive(false);
    }
  }, []);

  const completeOnboardingFlow = useCallback(async () => {
    await completeWelcomeAndEnterMainTabs();
    markOnboardingStepSeen('WELCOME');
  }, [completeWelcomeAndEnterMainTabs, markOnboardingStepSeen]);

  return useMemo<OnboardingContextType>(() => ({
    onboardingRoute,
    isOnboardingActive,
    loading,
    refreshOnboardingRoute,
    getOnboardingRedirect,
    markOnboardingStepSeen,
    completeOnboardingFlow,
  }), [
    onboardingRoute,
    isOnboardingActive,
    loading,
    refreshOnboardingRoute,
    getOnboardingRedirect,
    markOnboardingStepSeen,
    completeOnboardingFlow,
  ]);
}
