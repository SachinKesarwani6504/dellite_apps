import './global.css';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { applyGlobalAppFont } from '@/utils/app-fonts';
import { setupNotificationChannels } from '@/utils';
import { toastConfig } from '@/utils/toast';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require('./src/assets/fonts/Inter.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyGlobalAppFont();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    void setupNotificationChannels().catch((error) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[worker-notifications] channel-setup-failed', error);
      }
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <StatusBar style="light" />
          <AppNavigator />
          <Toast config={toastConfig} topOffset={58} />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
