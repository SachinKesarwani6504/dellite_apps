import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, ProfileStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS, PROFILE_SCREENS } from '@/types/screen-names';

export type OnboardingCertificationScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ONBOARDING_SCREENS.certification
>;

export type IdentityVerificationScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  typeof PROFILE_SCREENS.identityVerification
>;

export type ProfileCertificateManagerScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  typeof PROFILE_SCREENS.certificateManager
>;

export type SelectedAadhaarFile = {
  uri: string;
  name: string;
  type: string;
};
