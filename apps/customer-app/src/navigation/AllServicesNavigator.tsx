import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AllServicesScreen } from '@/screens/main/AllServicesScreen';
import { BookingConfirmationScreen } from '@/screens/main/BookingConfirmationScreen';
import { BookingDetailsScreen } from '@/screens/main/BookingDetailsScreen';
import { CategoryServicesScreen } from '@/screens/main/CategoryServicesScreen';
import { HOME_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export const ALL_SERVICES_STACK_SCREEN = {
  ROOT: 'AllServicesRoot',
} as const;

export function AllServicesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ALL_SERVICES_STACK_SCREEN.ROOT} component={AllServicesScreen} />
      {/* Reuse booking-flow screens so the tab stays on "All Services". */}
      <Stack.Screen name={HOME_SCREEN.SUBCATEGORY_SERVICES} component={CategoryServicesScreen} />
      <Stack.Screen name={HOME_SCREEN.BOOKING_DETAILS} component={BookingDetailsScreen} />
      <Stack.Screen name={HOME_SCREEN.BOOKING_CONFIRMATION} component={BookingConfirmationScreen} />
    </Stack.Navigator>
  );
}

