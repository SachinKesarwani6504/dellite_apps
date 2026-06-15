import type { AuthState } from '@/types/auth';
import type { LocationContextValue } from '@/modules/location/types/location.types';

export type StartupSplashGateControllerParams = {
  authState: AuthState;
  locationState: LocationContextValue;
};

export type StartupSplashGateControllerValue = {
  isAuthBootstrapping: boolean;
  isInitialStartupComplete: boolean;
  shouldShowSplash: boolean;
};
