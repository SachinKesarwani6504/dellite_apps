import type { AuthUser } from '@/types/auth';
import type { OnboardingRouteName } from '@/types/onboarding';
import { ONBOARDING_SCREEN } from '@/types/screen-names';

type CustomerOnboardingResolution = {
  route: OnboardingRouteName;
  isComplete: boolean;
};

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

export function resolveCustomerOnboarding(user: AuthUser | null | undefined): CustomerOnboardingResolution {
  const isBasicInfoCompleted =
    normalizeBoolean(user?.onboarding?.isBasicInfoCompleted)
    ?? normalizeBoolean(user?.isOnboardingDone)
    ?? normalizeBoolean(user?.isOnboardingCompleted)
    ?? false;

  const hasSeenWelcome =
    normalizeBoolean(user?.hasSeenOnboardingWelcomeScreen)
    ?? normalizeBoolean(user?.onboarding?.hasSeenOnboardingWelcomeScreen)
    ?? false;

  if (!isBasicInfoCompleted) {
    return {
      route: ONBOARDING_SCREEN.CUSTOMER_IDENTITY,
      isComplete: false,
    };
  }

  if (!hasSeenWelcome) {
    return {
      route: ONBOARDING_SCREEN.CUSTOMER_WELCOME,
      isComplete: false,
    };
  }

  return {
    route: ONBOARDING_SCREEN.CUSTOMER_WELCOME,
    isComplete: true,
  };
}
