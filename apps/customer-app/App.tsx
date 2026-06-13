import './global.css';
import { useEffect } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppBottomSheet } from '@/components/common/AppBottomSheet';
import { AuthProvider } from '@/contexts/AuthContext';
import { BottomSheetProvider } from '@/contexts/BottomSheetContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { InAppNotificationProvider } from '@/components/common/InAppNotificationProvider';
import { StartupSplashGate } from '@/components/common/StartupSplashGate';
import { AppNavigator } from '@/navigation/AppNavigator';
import { applyGlobalAppFont } from '@/utils/app-fonts';
import { setupNotificationChannels } from '@/utils';
import { toastConfig } from '@/utils/toast';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if already prevented or unavailable in development edge-cases.
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require('./src/assets/fonts/Inter.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    applyGlobalAppFont();
    void SplashScreen.hideAsync().catch(() => {
      // Ignore if splash is already hidden or unavailable.
    });
  }, [fontsLoaded]);

  useEffect(() => {
    void setupNotificationChannels().catch((error) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[customer-notifications] channel-setup-failed', error);
      }
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <BottomSheetProvider>
            <AuthProvider>
              <OnboardingProvider>
                <InAppNotificationProvider>
                  <StatusBar style="light" />
                  <AppNavigator />
                  <Toast config={toastConfig} topOffset={64} />
                  <StartupSplashGate />
                  <AppBottomSheet />
                </InAppNotificationProvider>
              </OnboardingProvider>
            </AuthProvider>
          </BottomSheetProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
