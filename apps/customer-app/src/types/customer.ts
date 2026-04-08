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
  lastName: string;
  email?: string;
  referralCode?: string;
};

export type UpdateCustomerProfilePayload = {
  firstName: string;
  lastName: string;
  email?: string;
  gender?: Gender;
};

export type CustomerProfileResponse = {
  profile: CustomerProfile;
};

export type CreateCustomerProfileResponse = {
  profile?: CustomerProfile;
  accessToken: string;
  refreshToken: string;
};
