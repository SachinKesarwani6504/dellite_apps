import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BookingDetailsScreen } from '@/screens/main/BookingDetailsScreen';
import { BookingsScreen } from '@/screens/main/BookingsScreen';
import { BOOKINGS_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export function BookingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={BOOKINGS_SCREEN.HOME} component={BookingsScreen} />
      <Stack.Screen name={BOOKINGS_SCREEN.DETAILS} component={BookingDetailsScreen} />
    </Stack.Navigator>
  );
}
