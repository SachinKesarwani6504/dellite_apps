import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingIdentityScreen } from '@/screens/onboarding/OnboardingIdentityScreen';
import { OnboardingAadhaarScreen } from '@/screens/onboarding/OnboardingAadhaarScreen';
import { OnboardingServiceSelectionScreen } from '@/screens/onboarding/OnboardingServiceSelectionScreen';
import { OnboardingCertificationScreen } from '@/screens/onboarding/OnboardingCertificationScreen';
import { OnboardingWelcomeScreen } from '@/screens/onboarding/OnboardingWelcomeScreen';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  const { onboardingRoute } = useAuth();

  return (
    <Stack.Navigator
      key={onboardingRoute}
      initialRouteName={onboardingRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ONBOARDING_SCREENS.identity} component={OnboardingIdentityScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.aadhaar} component={OnboardingAadhaarScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.serviceSelection} component={OnboardingServiceSelectionScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.certification} component={OnboardingCertificationScreen} />
      <Stack.Screen name={ONBOARDING_SCREENS.welcome} component={OnboardingWelcomeScreen} />
    </Stack.Navigator>
  );
}
