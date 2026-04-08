import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@/hooks/useAuth';
import { OnboardingCustomerWelcomeScreen } from '@/screens/onboarding/OnboardingCustomerWelcomeScreen';
import { OnboardingCustomerIdentityScreen } from '@/screens/onboarding/OnboardingCustomerIdentityScreen';
import { AUTH_STATUS } from '@/types/auth';
import { ONBOARDING_SCREEN } from '@/utils';
const Stack = createNativeStackNavigator();

export function OnboardingNavigator() {
  const { authState } = useAuth();
  const initialRouteName = authState.status === AUTH_STATUS.POST_ONBOARDING_WELCOME
    ? ONBOARDING_SCREEN.CUSTOMER_WELCOME
    : ONBOARDING_SCREEN.CUSTOMER_IDENTITY;

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
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
