import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingConfirmationScreen } from '@/screens/main/BookingConfirmationScreen';
import { BookingDraftDetailsScreen } from '@/screens/main/BookingDraftDetailsScreen';
import { BookingLocationPickerScreen } from '@/screens/main/BookingLocationPickerScreen';
import { CategoryServicesScreen } from '@/screens/main/CategoryServicesScreen';
import { HOME_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export function BookingFlowNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={HOME_SCREEN.CATEGORY_SUBCATEGORIES} component={CategoryServicesScreen} />
      <Stack.Screen name={HOME_SCREEN.SUBCATEGORY_SERVICES} component={CategoryServicesScreen} />
      <Stack.Screen name={HOME_SCREEN.BOOKING_DRAFT_DETAILS} component={BookingDraftDetailsScreen} />
      <Stack.Screen name={HOME_SCREEN.BOOKING_LOCATION_PICKER} component={BookingLocationPickerScreen} />
      <Stack.Screen name={HOME_SCREEN.BOOKING_CONFIRMATION} component={BookingConfirmationScreen} />
    </Stack.Navigator>
  );
}
