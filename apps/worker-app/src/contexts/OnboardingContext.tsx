import React, { createContext, useContext } from 'react';
import { useOnboardingController } from '@/hooks/useOnboardingController';
import { OnboardingContextType } from '@/types/onboarding-context';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const value = useOnboardingController();

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used inside OnboardingProvider');
  }
  return context;
}
