import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobDetailsScreen } from '@/screens/tabs/JobDetailsScreen';
import { JobsScreen } from '@/screens/tabs/JobsScreen';
import { JobStackParamList } from '@/types/navigation';
import { JOB_STACK_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<JobStackParamList>();

export function JobsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={JOB_STACK_SCREENS.home} component={JobsScreen} />
      <Stack.Screen name={JOB_STACK_SCREENS.details} component={JobDetailsScreen} />
    </Stack.Navigator>
  );
}

