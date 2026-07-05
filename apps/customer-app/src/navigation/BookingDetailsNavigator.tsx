import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingEditScreen } from '@/screens/main/BookingEditScreen';
import { BookingDetailsScreen } from '@/screens/main/BookingDetailsScreen';
import { BOOKINGS_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export function BookingDetailsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={BOOKINGS_SCREEN.DETAILS} component={BookingDetailsScreen} />
      <Stack.Screen name={BOOKINGS_SCREEN.EDIT} component={BookingEditScreen} />
    </Stack.Navigator>
  );
}
