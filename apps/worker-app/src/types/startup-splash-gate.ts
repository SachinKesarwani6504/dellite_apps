import type { AuthStatus } from '@/types/auth-status';
import type { LocationContextValue } from '@/modules/location/types/location.types';

export type StartupSplashGateControllerParams = {
  status: AuthStatus;
  locationState: LocationContextValue;
};

export type StartupSplashGateControllerValue = {
  isAuthBootstrapping: boolean;
  isInitialStartupComplete: boolean;
  shouldShowSplash: boolean;
};
