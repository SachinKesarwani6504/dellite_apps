import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { OnboardingCertificationScreen } from '@/screens/onboarding/OnboardingCertificationScreen';
import { OnboardingIdentityScreen } from '@/screens/onboarding/OnboardingIdentityScreen';
import { OnboardingServiceSelectionScreen } from '@/screens/onboarding/OnboardingServiceSelectionScreen';
import { WelcomeWorkerScreen } from '@/screens/onboarding/WelcomeWorkerScreen';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  const { onboardingRoute } = useOnboardingContext();

  return (
    <Stack.Navigator
      key={onboardingRoute}
      initialRouteName={onboardingRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ONBOARDING_SCREENS.identity} component={OnboardingIdentityScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.serviceSelection} component={OnboardingServiceSelectionScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.certification} component={OnboardingCertificationScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.welcomeWorker} component={WelcomeWorkerScreen} />
    </Stack.Navigator>
  );
}
