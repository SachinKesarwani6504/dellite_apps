export const AUTH_SCREENS = {
  phoneLogin: 'PhoneLogin',
  otpVerification: 'OtpVerification',
} as const;

export const ONBOARDING_SCREENS = {
  identity: 'OnboardingIdentity',
  serviceSelection: 'OnboardingServiceSelection',
  certification: 'OnboardingCertification',
  welcomeWorker: 'WelcomeWorker',
} as const;

export const PROFILE_SCREENS = {
  home: 'ProfileHome',
  editProfile: 'EditProfile',
  payoutDetails: 'PayoutDetails',
  helpSupport: 'HelpSupport',
  identityVerification: 'IdentityVerification',
  referral: 'Referral',
  allSkills: 'AllSkills',
  certificateManager: 'ProfileCertificateAddAndEdit',
  skillManager: 'ProfileSkillAddAndEdit',
} as const;

export const MAIN_TAB_SCREENS = {
  home: 'Home',
  ongoing: 'Ongoing',
  earnings: 'Earnings',
  profile: 'Profile',
} as const;

export const SCREEN_TITLES = {
  profile: {
    home: 'Profile',
    editProfile: 'Edit Profile',
    payoutDetails: 'Payout Details',
    helpSupport: 'Help & Support',
    identityVerification: 'Identity Verification',
    referral: 'Referral',
    allSkills: 'All Skills',
    certificateManager: 'Manage Certificates',
    skillManager: 'Manage Skills',
  },
} as const;
