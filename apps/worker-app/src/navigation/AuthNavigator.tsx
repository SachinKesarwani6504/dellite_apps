import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OtpVerificationScreen } from '@/screens/auth/OtpVerificationScreen';
import { PhoneLoginScreen } from '@/screens/auth/PhoneLoginScreen';
import { AuthStackParamList } from '@/types/navigation';
import { AUTH_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AUTH_SCREENS.phoneLogin} component={PhoneLoginScreen} />
      <Stack.Screen name={AUTH_SCREENS.otpVerification} component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
