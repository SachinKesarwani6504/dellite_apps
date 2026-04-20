import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { toastConfig } from '@/utils/toast';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <OnboardingProvider>
            <StatusBar style="light" />
            <AppNavigator />
            <Toast config={toastConfig} topOffset={64} />
          </OnboardingProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
