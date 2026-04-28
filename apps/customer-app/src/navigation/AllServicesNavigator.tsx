import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AllServicesScreen } from '@/screens/main/AllServicesScreen';

const Stack = createNativeStackNavigator();

export const ALL_SERVICES_STACK_SCREEN = {
  ROOT: 'AllServicesRoot',
} as const;

export function AllServicesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ALL_SERVICES_STACK_SCREEN.ROOT} component={AllServicesScreen} />
    </Stack.Navigator>
  );
}
