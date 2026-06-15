import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { HelpSupportScreen } from '@/screens/profile/HelpSupportScreen';
import { IdentityVerificationScreen } from '@/screens/profile/IdentityVerificationScreen';
import { NotificationsScreen } from '@/screens/profile/NotificationsScreen';
import { PayoutDetailsScreen } from '@/screens/profile/PayoutDetailsScreen';
import { ProfileCertificateAddAndEditScreen } from '@/screens/profile/ProfileCertificateAddAndEditScreen';
import { ProfileSkillAddAndEditScreen } from '@/screens/profile/ProfileSkillAddAndEditScreen';
import { ProfileSkillsScreen } from '@/screens/profile/ProfileSkillsScreen';
import { ReferralScreen } from '@/screens/profile/ReferralScreen';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileDetailsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={PROFILE_SCREENS.editProfile} component={EditProfileScreen} />
      <Stack.Screen name={PROFILE_SCREENS.payoutDetails} component={PayoutDetailsScreen} />
      <Stack.Screen name={PROFILE_SCREENS.helpSupport} component={HelpSupportScreen} />
      <Stack.Screen name={PROFILE_SCREENS.notifications} component={NotificationsScreen} />
      <Stack.Screen name={PROFILE_SCREENS.identityVerification} component={IdentityVerificationScreen} />
      <Stack.Screen name={PROFILE_SCREENS.referral} component={ReferralScreen} />
      <Stack.Screen name={PROFILE_SCREENS.allSkills} component={ProfileSkillsScreen} />
      <Stack.Screen name={PROFILE_SCREENS.certificateManager} component={ProfileCertificateAddAndEditScreen} />
      <Stack.Screen name={PROFILE_SCREENS.skillManager} component={ProfileSkillAddAndEditScreen} />
    </Stack.Navigator>
  );
}
