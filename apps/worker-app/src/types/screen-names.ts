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
  notifications: 'Notifications',
  identityVerification: 'IdentityVerification',
  referral: 'Referral',
  allSkills: 'AllSkills',
  certificateManager: 'ProfileCertificateAddAndEdit',
  skillManager: 'ProfileSkillAddAndEdit',
} as const;

export const MAIN_TAB_SCREENS = {
  home: 'Home',
  jobs: 'Jobs',
  earnings: 'Earnings',
  profile: 'Profile',
} as const;

export const ROOT_SCREENS = {
  authNavigator: 'AuthNavigator',
  onboardingNavigator: 'OnboardingNavigator',
  mainTabsNavigator: 'MainTabsNavigator',
  jobDetailsNavigator: 'JobDetailsNavigator',
} as const;

export const JOB_STACK_SCREENS = {
  home: 'JobsHome',
  details: 'JobDetails',
} as const;

export const SCREEN_TITLES = {
  profile: {
    home: 'Profile',
    editProfile: 'Edit Profile',
    payoutDetails: 'Payout Details',
    helpSupport: 'Help & Support',
    notifications: 'Notifications',
    identityVerification: 'Identity Verification',
    referral: 'Referral',
    allSkills: 'All Skills',
    certificateManager: 'Manage Certificates',
    skillManager: 'Manage Skills',
  },
} as const;
