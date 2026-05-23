import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobsStackParamList } from '@/types/navigation';
import { JOB_STACK_SCREENS } from '@/types/screen-names';
import { JobDetailsScreen } from '@/screens/tabs/JobDetailsScreen';

const Stack = createNativeStackNavigator<JobsStackParamList>();

export function JobDetailsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={JOB_STACK_SCREENS.details} component={JobDetailsScreen} />
    </Stack.Navigator>
  );
}
