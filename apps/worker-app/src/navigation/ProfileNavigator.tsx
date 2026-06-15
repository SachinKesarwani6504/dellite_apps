import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileHomeScreen } from '@/screens/profile/ProfileHomeScreen';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={PROFILE_SCREENS.home} component={ProfileHomeScreen} />
    </Stack.Navigator>
  );
}
