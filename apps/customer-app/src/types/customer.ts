import type { MultipartFile } from '@/types/http';
import type { Gender, OnboardingFlags } from '@/types/auth';

export type CustomerProfile = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  onboarding: OnboardingFlags;
};

export type UpdateCustomerIdentityPayload = {
  firstName: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  referralCode?: string;
  file?: MultipartFile;
};

export type UpdateCustomerProfilePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  preferredLanguage?: 'EN' | 'HI';
  hasSeenOnboardingWelcomeScreen?: boolean;
  file?: MultipartFile;
};

export type CustomerProfileResponse = {
  profile: CustomerProfile;
};

export type CreateCustomerProfileResponse = {
  profile?: CustomerProfile;
  accessToken: string;
  refreshToken: string;
};
