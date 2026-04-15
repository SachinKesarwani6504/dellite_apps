import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { HelpSupportScreen } from '@/screens/profile/HelpSupportScreen';
import { IdentityVerificationScreen } from '@/screens/profile/IdentityVerificationScreen';
import { PayoutDetailsScreen } from '@/screens/profile/PayoutDetailsScreen';
import { ProfileCertificateAddAndEditScreen } from '@/screens/profile/ProfileCertificateAddAndEditScreen';
import { ProfileHomeScreen } from '@/screens/profile/ProfileHomeScreen';
import { ProfileSkillAddAndEditScreen } from '@/screens/profile/ProfileSkillAddAndEditScreen';
import { ProfileSkillsScreen } from '@/screens/profile/ProfileSkillsScreen';
import { ReferralScreen } from '@/screens/profile/ReferralScreen';
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
      <Stack.Screen name={PROFILE_SCREENS.identityVerification} component={IdentityVerificationScreen} />
      <Stack.Screen name={PROFILE_SCREENS.referral} component={ReferralScreen} />
      <Stack.Screen name={PROFILE_SCREENS.allSkills} component={ProfileSkillsScreen} />
      <Stack.Screen name={PROFILE_SCREENS.certificateManager} component={ProfileCertificateAddAndEditScreen} />
      <Stack.Screen name={PROFILE_SCREENS.skillManager} component={ProfileSkillAddAndEditScreen} />
    </Stack.Navigator>
  );
}
