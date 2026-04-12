import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuthContext } from '@/contexts/AuthContext';
import type { OnboardingContextType } from '@/types/onboarding-context';
import type { OnboardingCurrentStep, OnboardingRouteName } from '@/types/onboarding';
import { AUTH_STATUS, type AuthStatus } from '@/types/auth';
import { ONBOARDING_SCREEN } from '@/types/screen-names';
import { resolveCustomerOnboarding } from '@/utils/customer-onboarding';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { authState, refreshMe, completeWelcomeAndEnterMainTabs } = useAuthContext();
  const [onboardingRoute, setOnboardingRoute] = useState<OnboardingRouteName>(ONBOARDING_SCREEN.CUSTOMER_IDENTITY);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localWelcomeSeen, setLocalWelcomeSeen] = useState(false);

  const resolveRouteFromStatus = useCallback((status: AuthStatus): OnboardingRouteName => {
    if (status === AUTH_STATUS.POST_ONBOARDING_WELCOME) {
      return ONBOARDING_SCREEN.CUSTOMER_WELCOME;
    }
    return ONBOARDING_SCREEN.CUSTOMER_IDENTITY;
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

    const next = resolveCustomerOnboarding(
      mergedUser,
    );

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
    applyUserSnapshot,
    localWelcomeSeen,
    resolveRouteFromStatus,
    refreshMe,
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

    void refreshOnboardingRoute();
  }, [authState.status, authState.tokens?.accessToken, refreshOnboardingRoute]);

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

  const value = useMemo<OnboardingContextType>(() => ({
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

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used inside OnboardingProvider');
  }
  return context;
}
