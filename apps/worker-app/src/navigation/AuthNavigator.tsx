import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthContext } from '@/contexts/AuthContext';
import { OtpVerificationScreen } from '@/screens/auth/OtpVerificationScreen';
import { PhoneLoginScreen } from '@/screens/auth/PhoneLoginScreen';
import { AuthStatus } from '@/types/auth-status';
import { AuthStackParamList } from '@/types/navigation';
import { AUTH_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { status } = useAuthContext();
  const initialRouteName = status === AuthStatus.OTP_SENT
    ? AUTH_SCREENS.otpVerification
    : AUTH_SCREENS.phoneLogin;

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AUTH_SCREENS.phoneLogin} component={PhoneLoginScreen} />
      <Stack.Screen name={AUTH_SCREENS.otpVerification} component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
