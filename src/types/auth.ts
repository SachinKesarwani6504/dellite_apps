export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';
export const APP_AUTH_ROLE: UserRole = 'WORKER';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

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
  [key: string]: unknown;
}

export interface WorkerOnboardingFlags {
  hasPhoneVerified?: boolean;
  hasCompletedBasicProfile?: boolean;
  hasAadhaarVerified?: boolean;
  hasAddedServiceSkills?: boolean;
  hasUploadedRequiredCertificates?: boolean;
  currentStep?: string;
}

export interface AuthMeResponse {
  user: AuthUser;
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

export interface SendOtpPayload {
  phone: string;
  role: UserRole;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
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
  bio?: string;
  experienceYears?: number;
  referralCode?: string;
}

export interface CustomerProfilePayload {
  firstName: string;
  lastName?: string;
  email?: string;
  gender?: Gender;
}

export interface WorkerServicePayload {
  city: string;
  services: string[];
}

export interface WorkerServiceUpdatePayload {
  workerServiceId: string;
  cityId?: string;
  experienceYears?: number;
  priceOverride?: number;
}

export interface AadhaarIdentityVerificationPayload {
  aadhaarVerificationReferenceId: string;
  aadhaarVerificationScore: number;
  aadhaarVerificationMethod?: 'QR_SCAN' | string;
  aadhaarVerificationProvider?: 'INTERNAL' | string;
  aadhaarFullName: string;
  aadhaarDateOfBirth: string;
  aadhaarGender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  aadhaarLast4: string;
  aadhaarMaskedNumber: string;
  aadhaarPhotoFileId: string;
}

export interface AadhaarIdentityVerificationRecord {
  id: string;
  userId: string;
  aadhaarVerificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | string;
  aadhaarVerificationMethod?: string;
  aadhaarVerificationProvider?: string;
  aadhaarVerificationReferenceId?: string;
  aadhaarVerificationScore?: number;
  aadhaarVerifiedAt?: string;
  aadhaarFullName?: string;
  aadhaarDateOfBirth?: string;
  aadhaarGender?: string;
  aadhaarPhotoFileId?: string;
  aadhaarLast4?: string;
  aadhaarMaskedNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  aadhaarPhotoFile?: {
    id: string;
    filename?: string;
    url?: string;
  };
}

export interface AadhaarIdentityVerificationSaveResult {
  isVerified: boolean;
  message?: string;
  record?: AadhaarIdentityVerificationRecord;
}

export interface WorkerCertificateWriteItem {
  certificateId?: string;
  certificateType: string;
  serviceIds: string[];
  fileId?: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
}

export interface WorkerCertificateCreatePayload {
  certificates: WorkerCertificateWriteItem[];
}

export interface WorkerCertificateUpdatePayload {
  certificates: WorkerCertificateWriteItem[];
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
    isActive?: boolean;
  }>;
  certificates: WorkerCertificateCard[];
};

export type WorkerStatusResponse = {
  statusCode: number;
  message: string;
  data: WorkerStatusData;
};
