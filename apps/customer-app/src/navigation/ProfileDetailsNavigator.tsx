import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { BookingsScreen } from '@/screens/main/BookingsScreen';
import { NotificationsScreen } from '@/screens/profile/NotificationsScreen';
import { ReferralScreen } from '@/screens/profile/ReferralScreen';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';
import { PROFILE_SCREEN } from '@/types/screen-names';

const Stack = createNativeStackNavigator();

export function ProfileDetailsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={PROFILE_SCREEN.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={PROFILE_SCREEN.REFERRAL} component={ReferralScreen} />
      <Stack.Screen name={PROFILE_SCREEN.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={PROFILE_SCREEN.SETTINGS} component={SettingsScreen} />
      <Stack.Screen
        name={PROFILE_SCREEN.BOOKINGS}
        component={BookingsScreen}
        initialParams={{ listMode: 'ALL' }}
      />
    </Stack.Navigator>
  );
}
