import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { View, useColorScheme } from 'react-native';
import { LoadingState } from '@/components/common/LoadingState';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { OnboardingCertificationScreen } from '@/screens/onboarding/OnboardingCertificationScreen';
import { OnboardingIdentityScreen } from '@/screens/onboarding/OnboardingIdentityScreen';
import { OnboardingServiceSelectionScreen } from '@/screens/onboarding/OnboardingServiceSelectionScreen';
import { WelcomeWorkerScreen } from '@/screens/onboarding/WelcomeWorkerScreen';
import { OnboardingRouteName } from '@/types/onboarding';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { palette } from '@/utils/theme';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  const isDark = useColorScheme() === 'dark';
  const { onboardingRoute, loading } = useOnboardingContext();
  const initialRouteRef = useRef<OnboardingRouteName | null>(null);

  useEffect(() => {
    if (loading) {
      initialRouteRef.current = null;
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? palette.dark.background : palette.light.background }}>
        <LoadingState containerClassName="flex-1 w-full" minHeight={0} />
      </View>
    );
  }

  if (!initialRouteRef.current) {
    initialRouteRef.current = onboardingRoute;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteRef.current}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ONBOARDING_SCREENS.identity} component={OnboardingIdentityScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.serviceSelection} component={OnboardingServiceSelectionScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.certification} component={OnboardingCertificationScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.welcomeWorker} component={WelcomeWorkerScreen} />
    </Stack.Navigator>
  );
}
