import type { MultipartFile } from '@/types/http';

export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';
export const APP_AUTH_ROLE: UserRole = 'WORKER';
export const REFERRAL_ROLES = {
  CUSTOMER: 'CUSTOMER',
  WORKER: 'WORKER',
} as const;
export type ReferralRole = (typeof REFERRAL_ROLES)[keyof typeof REFERRAL_ROLES];
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type PayoutMethodType = 'UPI' | 'BANK_ACCOUNT';

export type ReferralReward = {
  rewardType?: string;
  value?: string;
  unit?: string;
};

export type ReferralMatrixEntry = {
  key?: 'CC' | 'CW' | 'WC' | 'WW' | string;
  triggerEvent?: string;
  referrerTriggerEvent?: string;
  referredTriggerEvent?: string;
  referrerRole?: UserRole | string;
  referredRole?: UserRole | string;
  referrerReward?: ReferralReward;
  referredReward?: ReferralReward;
};

export type ReferralRewardSet = {
  whenReferredRoleIsCUSTOMER?: ReferralReward;
  whenReferredRoleIsWORKER?: ReferralReward;
};

export type ReferralInfo = {
  code?: string;
  triggerEvent?: string;
  supportedTriggerEvents?: string[];
  coinConversion?: {
    oneCoinEqualsRupees?: string;
    currency?: string;
  };
  signupRewardMatrix?: Record<'CC' | 'CW' | 'WC' | 'WW', ReferralMatrixEntry> & Record<string, ReferralMatrixEntry | undefined>;
  availableReferrerRoles?: Array<UserRole | string>;
  selectedRole?: UserRole | string;
  selectedRoleRewards?: ReferralRewardSet;
  rewardResolutionRule?: string;
  rewardsByReferralRole?: {
    CUSTOMER?: ReferralRewardSet;
    WORKER?: ReferralRewardSet;
    [key: string]: ReferralRewardSet | undefined;
  };
  bothRolesRule?: string;
};

export interface WorkerCurrentStatus {
  id?: string;
  workerId?: string;
  status?: string;
  isLatest?: boolean;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkerProfileLink {
  id?: string;
  userId?: string;
  currentStatus?: WorkerCurrentStatus;
  skillCount?: number;
  completedJobCount?: number;
  certificatesCount?: number;
  [key: string]: unknown;
}

export interface AadharFileMeta {
  id?: string;
  filename?: string;
  filepath?: string;
  url?: string;
  [key: string]: unknown;
}

export interface UserAadharData {
  id?: string;
  status?: string;
  isVerified?: boolean;
  hasAadharFrontFile?: boolean;
  hasAadharBackFile?: boolean;
  aadharFrontFileId?: string;
  aadharBackFileId?: string;
  aadharFrontFile?: AadharFileMeta | null;
  aadharBackFile?: AadharFileMeta | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageId?: string;
  profileImage?: {
    id?: string;
    url?: string;
    filename?: string;
    [key: string]: unknown;
  };
  gender?: Gender;
  referralCode?: string;
  referral?: ReferralInfo;
  roles?: Record<UserRole, boolean> & Record<string, boolean>;
  userIdentityVerification?: {
    id?: string;
    status?: string;
    isVerified?: boolean | string | number;
    hasAadhaarFrontFile?: boolean;
    hasAadhaarBackFile?: boolean;
    aadhaarFrontFileId?: string;
    aadhaarBackFileId?: string;
    aadhaarFrontFile?: {
      id?: string;
      filename?: string;
      url?: string;
      [key: string]: unknown;
    };
    aadhaarBackFile?: {
      id?: string;
      filename?: string;
      url?: string;
      [key: string]: unknown;
    };
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  };
  workerLink?: WorkerProfileLink;
  createdAt?: string;
  [key: string]: unknown;
}

export interface WorkerOnboardingFlags {
  hasPhoneVerified?: boolean;
  hasCompletedBasicProfile?: boolean;
  hasAddedServiceSkills?: boolean;
  hasUploadedRequiredCertificates?: boolean;
  hasSeenSkillSetup?: boolean;
  hasSeenCertificateSetup?: boolean;
  hasSeenOnboardingWelcomeScreen?: boolean;
  isAnyServiceApprovedToEarnMoney?: boolean;
  currentStep?: string;
}

export interface AuthMeResponse {
  user: AuthUser;
  referral?: ReferralInfo;
  roles?: Record<UserRole, boolean> & Record<string, boolean>;
  links?: {
    worker?: WorkerProfileLink;
    [key: string]: unknown;
  };
  onboarding?:
    | ({
        role?: UserRole;
      } & WorkerOnboardingFlags)
    | {
    WORKER?: WorkerOnboardingFlags;
    [key: string]: unknown;
      };
  [key: string]: unknown;
}

export interface UserBankInfo {
  id: string;
  userId: string;
  methodType: PayoutMethodType;
  accountHolderName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  upiId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserBankInfoPayload {
  methodType: PayoutMethodType;
  accountHolderName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  upiId?: string;
}

export interface SendOtpPayload {
  phone: string;
  role: UserRole;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
  role: UserRole;
}

export interface VerifyOtpResult {
  accessToken?: string;
  refreshToken?: string;
  phoneToken?: string;
  user?: AuthUser;
}

export interface WorkerProfilePayload {
  firstName: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
  preferredLanguage?: 'EN' | 'HI';
  bio?: string;
  experienceYears?: number;
  referralCode?: string;
  profileImage?: MultipartFile;
  aadhaarFront?: MultipartFile;
  aadhaarBack?: MultipartFile;
  aadhaarFrontFilepath?: string;
  aadhaarFrontFilename?: string;
  aadhaarBackFilepath?: string;
  aadhaarBackFilename?: string;
  aadhaarFrontFilePath?: string;
  aadhaarFrontFileName?: string;
  aadhaarBackFilePath?: string;
  aadhaarBackFileName?: string;
  hasSeenSkillSetup?: boolean;
  hasSeenCertificateSetup?: boolean;
  hasSeenOnboardingWelcomeScreen?: boolean;
}

export interface CustomerProfilePayload {
  firstName: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
}

export interface WorkerServicePayload {
  city: string;
  skills?: string[];
  services?: string[];
}

export interface WorkerServiceUpdatePayload {
  workerSkillId?: string;
  workerServiceId?: string;
  cityId?: string;
  experienceYears?: number;
  priceOverride?: number;
  isAvailable?: boolean;
}

export interface CreateWorkerCertificateItem {
  certificateId?: string;
  certificateType: string;
  workerSkillIds?: string[];
  serviceIds?: string[];
  fileId?: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  fileField?: string;
}

export interface UpdateWorkerCertificateItem extends CreateWorkerCertificateItem {
  certificateId?: string;
}

export type WorkerCertificateWriteItem = UpdateWorkerCertificateItem;

export interface WorkerCertificateCreatePayload {
  certificates: CreateWorkerCertificateItem[];
}

export interface WorkerCertificateUpdatePayload {
  certificates: UpdateWorkerCertificateItem[];
}

export interface CategoryService {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  isCertificateRequired?: boolean;
}

export interface ServiceSubcategory {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  services?: CategoryService[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  iconText?: string;
  subcategories?: ServiceSubcategory[];
  services?: CategoryService[];
}

export interface CategoriesQuery {
  city: string;
  includeSubcategory?: boolean;
  includeServices?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
}

export type WorkerCertificateStatus = 'NOT_UPLOADED' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export type WorkerCertificateCard = {
  title: string;
  description: string;
  allowedCertificateTypes: string[];
  buttonText: string;
  certificateStatus: WorkerCertificateStatus;
  serviceId: string;
  serviceName: string;
  serviceIds: string[];
  serviceNames: string[];
  workerServiceId: string;
  workerServiceIds: string[];
  workerSkillId: string | null;
  workerSkillIds: string[];
  latestCertificateId: string | null;
  latestFileId: string | null;
  latestCertificateType: string | null;
};

export type WorkerStatusData = {
  summary?: {
    totalSkills?: number;
    approvedSkills?: number;
    totalRequiredCertificateGroups?: number;
    approvedCertificateGroups?: number;
  };
  skills?: Array<{
    id?: string;
    serviceId?: string;
    serviceName?: string;
    status?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    isAvailable?: boolean;
    isCertificateRequired?: boolean;
    isCertificateAdded?: boolean;
  }>;
  certificates: WorkerCertificateCard[];
};

export type WorkerStatusResponse = {
  statusCode: number;
  message: string;
  data: WorkerStatusData;
};

export type WorkerHomeCurrentStatus = WorkerCurrentStatus;

export interface WorkerHomeHeaderBanner {
  imageUrl?: string;
  name?: string;
  averageRating?: number;
  reviewsCount?: number;
}

export interface WorkerHomeTodayStats {
  totalJobs?: number;
  totalEarning?: number;
  growth?: number | string;
}

export interface WorkerHomeNearbyJob {
  id?: string;
  title?: string;
  distanceKm?: number;
  city?: string;
  payout?: number;
  imageUrl?: string;
}

export interface WorkerHomeFooter {
  madeWith?: string;
  from?: string;
  region?: string;
  copyright?: string;
}

export interface WorkerHomeData {
  currentStatus?: WorkerHomeCurrentStatus | null;
  headerBanner?: WorkerHomeHeaderBanner;
  todayStats?: WorkerHomeTodayStats;
  availableNearbyJobs?: WorkerHomeNearbyJob[];
  footer?: WorkerHomeFooter;
}
