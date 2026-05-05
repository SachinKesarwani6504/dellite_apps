import './global.css';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { applyGlobalAppFont } from '@/utils/app-fonts';
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <StatusBar style="light" />
          <AppNavigator />
          <Toast config={toastConfig} topOffset={64} />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
