import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileScreen } from '@/screens/main/ProfileScreen';
import { PROFILE_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={PROFILE_SCREEN.PROFILE_HOME} component={ProfileScreen} />
    </Stack.Navigator>
  );
}

