import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthContext } from '@/contexts/AuthContext';
import { OtpVerificationScreen } from '@/screens/auth/OtpVerificationScreen';
import { PhoneLoginScreen } from '@/screens/auth/PhoneLoginScreen';
import { AUTH_STATUS } from '@/types/auth';
import { AUTH_SCREEN } from '@/utils';
const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  const { authState } = useAuthContext();
  const initialRouteName = authState.status === AUTH_STATUS.OTP_SENT
    ? AUTH_SCREEN.OTP_VERIFICATION
    : AUTH_SCREEN.PHONE_LOGIN;

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AUTH_SCREEN.PHONE_LOGIN} component={PhoneLoginScreen} />
      <Stack.Screen name={AUTH_SCREEN.OTP_VERIFICATION} component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
