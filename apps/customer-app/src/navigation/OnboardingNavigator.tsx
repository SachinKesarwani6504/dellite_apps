import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { OnboardingCustomerWelcomeScreen } from '@/screens/onboarding/OnboardingCustomerWelcomeScreen';
import { OnboardingCustomerIdentityScreen } from '@/screens/onboarding/OnboardingCustomerIdentityScreen';
import { ONBOARDING_SCREEN } from '@/utils';
const Stack = createNativeStackNavigator();

export function OnboardingNavigator() {
  const { onboardingRoute } = useOnboardingContext();

  return (
    <Stack.Navigator key={onboardingRoute} initialRouteName={onboardingRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ONBOARDING_SCREEN.CUSTOMER_IDENTITY}
        component={OnboardingCustomerIdentityScreen}
      />
      <Stack.Screen
        name={ONBOARDING_SCREEN.CUSTOMER_WELCOME}
        component={OnboardingCustomerWelcomeScreen}
      />
    </Stack.Navigator>
  );
}
