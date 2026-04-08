import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { HelpSupportScreen } from '@/screens/profile/HelpSupportScreen';
import { PayoutDetailsScreen } from '@/screens/profile/PayoutDetailsScreen';
import { ProfileHomeScreen } from '@/screens/profile/ProfileHomeScreen';
import { ProfileSkillsScreen } from '@/screens/profile/ProfileSkillsScreen';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={PROFILE_SCREENS.home} component={ProfileHomeScreen} />
      <Stack.Screen name={PROFILE_SCREENS.editProfile} component={EditProfileScreen} />
      <Stack.Screen name={PROFILE_SCREENS.payoutDetails} component={PayoutDetailsScreen} />
      <Stack.Screen name={PROFILE_SCREENS.helpSupport} component={HelpSupportScreen} />
      <Stack.Screen name={PROFILE_SCREENS.allSkills} component={ProfileSkillsScreen} />
    </Stack.Navigator>
  );
}
