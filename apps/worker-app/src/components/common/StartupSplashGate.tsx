import { StyleSheet, View } from 'react-native';

import { useAuthContext } from '@/contexts/AuthContext';
import { useStartupSplashGateController } from '@/hooks/useStartupSplashGateController';
import { AnimatedLogoSplash } from './AnimatedLogoSplash';

export function StartupSplashGate() {
  const { status, locationState } = useAuthContext();
  const { isInitialStartupComplete, shouldShowSplash } = useStartupSplashGateController({
    status,
    locationState,
  });

  if (isInitialStartupComplete || !shouldShowSplash) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <AnimatedLogoSplash />
    </View>
  );
}
