import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { HOME_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={HOME_SCREEN.HOME} component={HomeScreen} />
    </Stack.Navigator>
  );
}
