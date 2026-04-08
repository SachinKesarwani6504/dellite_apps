import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OtpVerificationScreen } from '@/screens/auth/OtpVerificationScreen';
import { PhoneLoginScreen } from '@/screens/auth/PhoneLoginScreen';
import { AUTH_SCREEN } from '@/utils';
const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AUTH_SCREEN.PHONE_LOGIN} component={PhoneLoginScreen} />
      <Stack.Screen name={AUTH_SCREEN.OTP_VERIFICATION} component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
