import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobsScreen } from '@/screens/tabs/JobsScreen';
import { JobStackParamList } from '@/types/navigation';
import { JOB_STACK_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<JobStackParamList>();

export function JobsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={JOB_STACK_SCREENS.home} component={JobsScreen} />
    </Stack.Navigator>
  );
}
