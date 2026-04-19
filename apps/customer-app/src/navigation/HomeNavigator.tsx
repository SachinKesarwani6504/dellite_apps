import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingFlowProvider } from '@/contexts/BookingFlowContext';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { BookingConfirmationScreen } from '@/screens/main/BookingConfirmationScreen';
import { BookingDetailsScreen } from '@/screens/main/BookingDetailsScreen';
import { CategoryServicesScreen } from '@/screens/main/CategoryServicesScreen';
import { HOME_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export function HomeNavigator() {
  return (
    <BookingFlowProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={HOME_SCREEN.HOME} component={HomeScreen} />
        <Stack.Screen name={HOME_SCREEN.CATEGORY_SUBCATEGORIES} component={CategoryServicesScreen} />
        <Stack.Screen name={HOME_SCREEN.SUBCATEGORY_SERVICES} component={CategoryServicesScreen} />
        <Stack.Screen name={HOME_SCREEN.BOOKING_DETAILS} component={BookingDetailsScreen} />
        <Stack.Screen name={HOME_SCREEN.BOOKING_CONFIRMATION} component={BookingConfirmationScreen} />
      </Stack.Navigator>
    </BookingFlowProvider>
  );
}
