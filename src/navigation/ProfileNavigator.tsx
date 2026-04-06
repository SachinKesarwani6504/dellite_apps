import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { HelpSupportScreen } from '@/screens/profile/HelpSupportScreen';
import { PayoutDetailsScreen } from '@/screens/profile/PayoutDetailsScreen';
import { ProfileHomeScreen } from '@/screens/profile/ProfileHomeScreen';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS, SCREEN_TITLES } from '@/types/screen-names';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={PROFILE_SCREENS.home} component={ProfileHomeScreen} options={{ title: SCREEN_TITLES.profile.home }} />
      <Stack.Screen name={PROFILE_SCREENS.editProfile} component={EditProfileScreen} options={{ title: SCREEN_TITLES.profile.editProfile }} />
      <Stack.Screen name={PROFILE_SCREENS.payoutDetails} component={PayoutDetailsScreen} options={{ title: SCREEN_TITLES.profile.payoutDetails }} />
      <Stack.Screen name={PROFILE_SCREENS.helpSupport} component={HelpSupportScreen} options={{ title: SCREEN_TITLES.profile.helpSupport }} />
    </Stack.Navigator>
  );
}
