import './global.css';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { toastConfig } from '@/utils/toast';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if already prevented or unavailable in development edge-cases.
});

export default function App() {
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
