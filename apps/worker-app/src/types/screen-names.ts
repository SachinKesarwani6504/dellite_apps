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
  settings: 'Settings',
  identityVerification: 'IdentityVerification',
  referral: 'Referral',
  allJobs: 'AllJobs',
  allSkills: 'AllSkills',
  certificateManager: 'ProfileCertificateAddAndEdit',
  skillManager: 'ProfileSkillAddAndEdit',
} as const;

export const MAIN_TAB_SCREENS = {
  home: 'Home',
  earnings: 'Earnings',
  profile: 'Profile',
} as const;

export const ROOT_SCREENS = {
  authNavigator: 'AuthNavigator',
  onboardingNavigator: 'OnboardingNavigator',
  mainTabsNavigator: 'MainTabsNavigator',
  jobsNavigator: 'JobsNavigator',
  jobDetailsNavigator: 'JobDetailsNavigator',
  profileDetailsNavigator: 'ProfileDetailsNavigator',
} as const;

export const EARNINGS_STACK_SCREENS = {
  home: 'EarningsHome',
  settlementDetail: 'SettlementDetail',
} as const;

export const JOB_STACK_SCREENS = {
  home: 'JobsHome',
  availableJobs: 'AvailableJobs',
  details: 'JobDetails',
} as const;

export const SCREEN_TITLES = {
  profile: {
    home: 'Profile',
    editProfile: 'Edit Profile',
    payoutDetails: 'Payout Details',
    helpSupport: 'Help & Support',
    notifications: 'Notifications',
    settings: 'Settings',
    identityVerification: 'Identity Verification',
    referral: 'Referral',
    allJobs: 'All Jobs',
    allSkills: 'All Skills',
    certificateManager: 'Manage Certificates',
    skillManager: 'Manage Skills',
  },
} as const;
