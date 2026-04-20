import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import { ApiEnvelope } from '@/types/api';
import {
  CategoryService,
  CategoriesQuery,
  ServiceCategory,
  ServiceSubcategory,
  WorkerCertificateCard,
  WorkerCertificateCreatePayload,
  WorkerCertificateUpdatePayload,
  WorkerProfilePayload,
  WorkerServicePayload,
  WorkerServiceUpdatePayload,
  WorkerHomeData,
  WorkerHomeFooter,
  WorkerHomeHeaderBanner,
  WorkerHomeNearbyJob,
  WorkerHomeTodayStats,
  WorkerStatusData,
  WorkerStatusResponse,
} from '@/types/auth';
import { normalizeCertificatePayload, validateCertificatePayloadItems } from '@/utils/certificate-payload';
import { toFormData } from '@/utils/form-data';
import type { MultipartFile } from '@/types/http';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

const workerHomeCacheByCity = new Map<string, WorkerHomeData>();

function normalizeCity(city: string) {
  return city.trim().toUpperCase();
}

type RawServiceSubcategory = Omit<ServiceSubcategory, 'services'> & {
  services?: CategoryService[];
};

type RawServiceCategory = Omit<ServiceCategory, 'subcategories'> & {
  subcategories?: RawServiceSubcategory[];
  subCategories?: RawServiceSubcategory[];
};

type WorkerStatusEnvelopeOrData = WorkerStatusResponse | WorkerStatusData;
type WorkerStatusSortDirection = 'asc' | 'desc';
type WorkerStatusQuery = {
  sortBy?: 'status';
  direction?: WorkerStatusSortDirection;
};

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function normalizeWorkerHomeHeaderBanner(value: unknown): WorkerHomeHeaderBanner | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  return {
    imageUrl: toOptionalString(raw.imageUrl ?? raw.image_url),
    name: toOptionalString(raw.name),
    averageRating: toOptionalNumber(raw.averageRating ?? raw.average_rating),
    reviewsCount: toOptionalNumber(raw.reviewsCount ?? raw.reviews_count),
  };
}

function normalizeWorkerHomeTodayStats(value: unknown): WorkerHomeTodayStats | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const growthRaw = raw.growth;
  const growth = typeof growthRaw === 'string'
    ? growthRaw
    : toOptionalNumber(growthRaw);
  return {
    totalJobs: toOptionalNumber(raw.totalJobs ?? raw.total_jobs),
    totalEarning: toOptionalNumber(raw.totalEarning ?? raw.total_earning),
    growth,
  };
}

function normalizeWorkerHomeNearbyJob(value: unknown): WorkerHomeNearbyJob | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  return {
    id: toOptionalString(raw.id),
    title: toOptionalString(raw.title ?? raw.name ?? raw.serviceName ?? raw.service_name),
    distanceKm: toOptionalNumber(raw.distanceKm ?? raw.distance_km),
    city: toOptionalString(raw.city),
    payout: toOptionalNumber(raw.payout),
    imageUrl: toOptionalString(raw.imageUrl ?? raw.image_url),
  };
}

function normalizeWorkerHomeFooter(value: unknown): WorkerHomeFooter | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  return {
    madeWith: toOptionalString(raw.madeWith ?? raw.made_with),
    from: toOptionalString(raw.from),
    region: toOptionalString(raw.region),
    copyright: toOptionalString(raw.copyright),
  };
}

function normalizeWorkerHomeData(value: unknown): WorkerHomeData {
  if (!value || typeof value !== 'object') {
    return { availableNearbyJobs: [] };
  }
  const raw = value as Record<string, unknown>;
  const currentStatusRaw = raw.currentStatus ?? raw.current_status;
  const currentStatus = currentStatusRaw && typeof currentStatusRaw === 'object'
    ? {
      id: toOptionalString((currentStatusRaw as Record<string, unknown>).id),
      workerId: toOptionalString((currentStatusRaw as Record<string, unknown>).workerId ?? (currentStatusRaw as Record<string, unknown>).worker_id),
      status: toOptionalString((currentStatusRaw as Record<string, unknown>).status),
      isLatest: toOptionalBoolean((currentStatusRaw as Record<string, unknown>).isLatest ?? (currentStatusRaw as Record<string, unknown>).is_latest),
      message: toOptionalString((currentStatusRaw as Record<string, unknown>).message),
      createdAt: toOptionalString((currentStatusRaw as Record<string, unknown>).createdAt ?? (currentStatusRaw as Record<string, unknown>).created_at),
      updatedAt: toOptionalString((currentStatusRaw as Record<string, unknown>).updatedAt ?? (currentStatusRaw as Record<string, unknown>).updated_at),
    }
    : null;

  const jobsSource = Array.isArray(raw.availableNearbyJobs)
    ? raw.availableNearbyJobs
    : (Array.isArray(raw.available_nearby_jobs) ? raw.available_nearby_jobs : []);
  const availableNearbyJobs = jobsSource
    .map(normalizeWorkerHomeNearbyJob)
    .filter((job): job is WorkerHomeNearbyJob => Boolean(job));

  return {
    currentStatus,
    headerBanner: normalizeWorkerHomeHeaderBanner(raw.headerBanner ?? raw.header_banner),
    todayStats: normalizeWorkerHomeTodayStats(raw.todayStats ?? raw.today_stats),
    availableNearbyJobs,
    footer: normalizeWorkerHomeFooter(raw.footer),
  };
}
type WorkerServiceCreateResponse = {
  city?: string;
  skillReviews?: unknown[];
  linkedSkills?: unknown[];
  linkedServices?: unknown[];
  newlyLinkedCount?: number;
  alreadyLinkedCount?: number;
  pendingApprovalCount?: number;
};
type WorkerServiceUpdateResponse = {
  id?: string;
  workerId?: string;
  serviceAvailabilityId?: string;
  updatedAt?: string;
  workerSkillId?: string;
  mappedCityId?: string | null;
  workerServiceId?: string;
  cityId?: string | null;
};

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function normalizeService(service: CategoryService): CategoryService {
  const raw = service as CategoryService & Record<string, unknown>;
  return {
    ...service,
    isCertificateRequired: toOptionalBoolean(raw.isCertificateRequired)
      ?? toOptionalBoolean(raw.is_certificate_required)
      ?? toOptionalBoolean(raw.requiresCertificate)
      ?? toOptionalBoolean(raw.requires_certificate)
      ?? false,
  };
}

function normalizeCategory(category: RawServiceCategory): ServiceCategory {
  const normalizedSubcategories = Array.isArray(category.subcategories)
    ? category.subcategories
    : Array.isArray(category.subCategories)
      ? category.subCategories
      : [];
  return {
    ...category,
    services: Array.isArray(category.services) ? category.services.map(normalizeService) : [],
    subcategories: normalizedSubcategories.map(subcategory => ({
      ...subcategory,
      services: Array.isArray(subcategory.services) ? subcategory.services.map(normalizeService) : [],
    })),
  };
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeWorkerServiceCreateResponse(payload: unknown): WorkerServiceCreateResponse {
  if (!payload || typeof payload !== 'object') return {};
  const raw = payload as Record<string, unknown>;
  return {
    city: typeof raw.city === 'string' ? raw.city : undefined,
    skillReviews: toArray(raw.skillReviews),
    linkedSkills: toArray(raw.linkedSkills),
    linkedServices: toArray(raw.linkedServices),
    newlyLinkedCount: typeof raw.newlyLinkedCount === 'number' ? raw.newlyLinkedCount : undefined,
    alreadyLinkedCount: typeof raw.alreadyLinkedCount === 'number' ? raw.alreadyLinkedCount : undefined,
    pendingApprovalCount: typeof raw.pendingApprovalCount === 'number' ? raw.pendingApprovalCount : undefined,
  };
}

function normalizeWorkerServiceUpdateResponse(payload: unknown): WorkerServiceUpdateResponse {
  if (!payload || typeof payload !== 'object') return {};
  const raw = payload as Record<string, unknown>;
  const workerSkillId = typeof raw.workerSkillId === 'string'
    ? raw.workerSkillId
    : (typeof raw.workerServiceId === 'string' ? raw.workerServiceId : undefined);
  const mappedCityId = typeof raw.mappedCityId === 'string'
    ? raw.mappedCityId
    : (raw.mappedCityId === null ? null : (typeof raw.cityId === 'string' ? raw.cityId : null));

  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    workerId: typeof raw.workerId === 'string' ? raw.workerId : undefined,
    serviceAvailabilityId: typeof raw.serviceAvailabilityId === 'string' ? raw.serviceAvailabilityId : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    workerSkillId,
    mappedCityId,
    workerServiceId: typeof raw.workerServiceId === 'string' ? raw.workerServiceId : undefined,
    cityId: typeof raw.cityId === 'string' ? raw.cityId : (raw.cityId === null ? null : undefined),
  };
}

function toMultipartCertificateFile(item: WorkerCertificateCreatePayload['certificates'][number]): MultipartFile | null {
  if (!item.fileUrl || !item.fileName) return null;
  const normalizedUri = item.fileUrl.trim();
  const normalizedName = item.fileName.trim();
  if (!normalizedUri || !normalizedName) return null;
  return {
    uri: normalizedUri,
    name: normalizedName,
    type: item.fileType ?? 'application/octet-stream',
  };
}

function buildWorkerCertificatesFormData(payload: WorkerCertificateCreatePayload | WorkerCertificateUpdatePayload) {
  const filesMap: Record<string, MultipartFile> = {};
  const certificates = (payload.certificates ?? []).map((certificate, index) => {
    const file = toMultipartCertificateFile(certificate);
    if (!file || certificate.fileId) {
      return certificate;
    }

    const fileField = certificate.fileField?.trim() || `certificateFile_${index}`;
    filesMap[fileField] = file;
    return {
      ...certificate,
      fileField,
      fileId: undefined,
      fileName: undefined,
      fileType: undefined,
      fileUrl: undefined,
    };
  });

  return toFormData(
    {
      certificates,
    },
    filesMap,
  );
}

export async function listWorkers<T = unknown>() {
  const response = await apiGet<ApiEnvelope<T>>('/worker', { auth: true });
  return unwrapData(response);
}

function toQueryString(query: CategoriesQuery) {
  const params = new URLSearchParams();
  params.set('city', query.city);
  if (typeof query.includeSubcategory === 'boolean') {
    params.set('includeSubcategory', String(query.includeSubcategory));
  }
  if (typeof query.includeServices === 'boolean') {
    params.set('includeServices', String(query.includeServices));
  }
  if (typeof query.includePriceOptions === 'boolean') {
    params.set('includePriceOptions', String(query.includePriceOptions));
  }
  if (typeof query.includeTask === 'boolean') {
    params.set('includeTask', String(query.includeTask));
  }
  return params.toString();
}

export async function getCategories(query: CategoriesQuery): Promise<ServiceCategory[]> {
  const qs = toQueryString(query);
  const response = await apiGet<ApiEnvelope<RawServiceCategory[]>>(`/categories?${qs}`);
  const data = unwrapData(response);
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is RawServiceCategory => Boolean(item && typeof item === 'object'))
    .map(normalizeCategory);
}

export async function getWorkerById<T = unknown>(id: string) {
  const response = await apiGet<ApiEnvelope<T>>(`/worker/${id}`, { auth: true });
  return unwrapData(response);
}

export async function createWorkerProfile(payload: WorkerProfilePayload) {
  // Example: await createWorkerProfile({ firstName: 'Sachin', aadhaarFront: { uri, name, type }, aadhaarBack: { uri, name, type } });
  const formData = toFormData(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      gender: payload.gender,
      bio: payload.bio,
      experienceYears: payload.experienceYears,
      referralCode: payload.referralCode,
      aadhaarFrontFilepath: payload.aadhaarFrontFilepath ?? payload.aadhaarFrontFilePath,
      aadhaarFrontFilename: payload.aadhaarFrontFilename ?? payload.aadhaarFrontFileName,
      aadhaarBackFilepath: payload.aadhaarBackFilepath ?? payload.aadhaarBackFilePath,
      aadhaarBackFilename: payload.aadhaarBackFilename ?? payload.aadhaarBackFileName,
    },
    {
      profileImage: payload.profileImage,
      aadhaarFront: payload.aadhaarFront,
      aadhaarBack: payload.aadhaarBack,
    },
  );

  const response = await apiPost<ApiEnvelope<unknown>, FormData>(
    '/worker/profile',
    formData,
    {
      tokenType: 'phone',
      toast: {
        successTitle: 'Profile Created',
        successMessage: 'Worker profile has been created successfully.',
        errorTitle: 'Profile Creation Failed',
      },
    },
  );
  return unwrapData(response);
}

export async function updateWorkerProfile(
  payload: Partial<WorkerProfilePayload>,
  options?: { showSuccessToast?: boolean; showErrorToast?: boolean },
) {
  // Example: await updateWorkerProfile({ firstName: 'Sachin', preferredLanguage: 'EN', profileImage: { uri, name, type } });
  const formData = toFormData(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      gender: payload.gender,
      preferredLanguage: payload.preferredLanguage,
      bio: payload.bio,
      experienceYears: payload.experienceYears,
      hasSeenOnboardingWelcomeScreen: payload.hasSeenOnboardingWelcomeScreen,
      hasSeenSkillSetup: payload.hasSeenSkillSetup,
      hasSeenCertificateSetup: payload.hasSeenCertificateSetup,
      aadhaarFrontFilepath: payload.aadhaarFrontFilepath ?? payload.aadhaarFrontFilePath,
      aadhaarFrontFilename: payload.aadhaarFrontFilename ?? payload.aadhaarFrontFileName,
      aadhaarBackFilepath: payload.aadhaarBackFilepath ?? payload.aadhaarBackFilePath,
      aadhaarBackFilename: payload.aadhaarBackFilename ?? payload.aadhaarBackFileName,
    },
    {
      profileImage: payload.profileImage,
      aadhaarFront: payload.aadhaarFront,
      aadhaarBack: payload.aadhaarBack,
    },
  );

  const response = await apiPatch<ApiEnvelope<unknown>, FormData>(
    '/worker/profile',
    formData,
    {
      auth: true,
      toast: {
        showSuccess: options?.showSuccessToast ?? true,
        showError: options?.showErrorToast ?? true,
        successTitle: 'Profile Updated',
        successMessage: 'Worker profile changes were updated.',
        errorTitle: 'Profile Update Failed',
      },
    },
  );
  return unwrapData(response);
}

function toWorkerStatusQueryString(query?: WorkerStatusQuery) {
  if (!query || query.sortBy !== 'status' || !query.direction) return '';
  const params = new URLSearchParams();
  params.set('sortBy', query.sortBy);
  params.set('direction', query.direction);
  return params.toString();
}

export async function getWorkerStatus<T = WorkerStatusData>(query?: WorkerStatusQuery) {
  const qs = toWorkerStatusQueryString(query);
  const path = qs ? `/worker/skills/status?${qs}` : '/worker/skills/status';
  const response = await apiGet<ApiEnvelope<WorkerStatusEnvelopeOrData>>(path, { auth: true });
  const data = unwrapData(response) as WorkerStatusEnvelopeOrData;

  // Supports both wrapped { statusCode, message, data } and direct payload formats.
  const statusData = (data && typeof data === 'object' && 'data' in data)
    ? (data as WorkerStatusResponse).data
    : (data as WorkerStatusData);

  const rawCertificates = Array.isArray((statusData as { certificates?: unknown[] })?.certificates)
    ? ((statusData as { certificates?: unknown[] }).certificates as WorkerCertificateCard[])
    : Array.isArray((statusData as { requiredCertificates?: unknown[] })?.requiredCertificates)
      ? ((statusData as { requiredCertificates?: unknown[] }).requiredCertificates as WorkerCertificateCard[])
      : [];
  const rawSkills = Array.isArray(statusData?.skills) ? statusData.skills : [];
  const normalizedSkills = rawSkills
    .filter((skill): skill is NonNullable<(typeof rawSkills)[number]> => Boolean(skill && typeof skill === 'object'))
    .map(skill => {
      const raw = skill as Record<string, unknown>;
      const id = typeof skill.id === 'string' ? skill.id : undefined;
      const serviceId = typeof skill.serviceId === 'string' ? skill.serviceId : undefined;
      const serviceName = typeof skill.serviceName === 'string' ? skill.serviceName : undefined;
      const serviceNameKey = typeof serviceName === 'string' ? serviceName.trim().toUpperCase() : '';
      return {
        ...skill,
        id,
        serviceId,
        serviceName,
        isAvailable: toOptionalBoolean(raw.isAvailable)
          ?? toOptionalBoolean(raw.is_available)
          ?? toOptionalBoolean(raw.isActive)
          ?? toOptionalBoolean(raw.is_active),
        serviceNameKey,
        rawServiceId: typeof raw.service_id === 'string' ? raw.service_id : undefined,
        rawServiceName: typeof raw.service_name === 'string' ? raw.service_name : undefined,
      };
    });

  const normalizedCards = Array.isArray(rawCertificates)
    ? rawCertificates
      .filter((card): card is WorkerCertificateCard => Boolean(card && typeof card === 'object'))
      .map(card => {
        const raw = card as WorkerCertificateCard & Record<string, unknown>;
        const explicitServiceIds = Array.isArray(card.serviceIds)
          ? card.serviceIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          : (typeof card.serviceId === 'string' && card.serviceId.trim().length > 0 ? [card.serviceId] : []);
        const explicitServiceNameKeys = (
          Array.isArray(card.serviceNames) && card.serviceNames.length > 0
            ? card.serviceNames
            : (typeof card.serviceName === 'string' && card.serviceName.trim().length > 0 ? [card.serviceName] : [])
        )
          .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
          .map(name => name.trim().toUpperCase());

        const matchedSkills = normalizedSkills.filter(skill => {
          const byServiceId = explicitServiceIds.length > 0
            && Boolean(skill.serviceId && explicitServiceIds.includes(skill.serviceId));
          const byServiceName = explicitServiceNameKeys.length > 0
            && Boolean(skill.serviceNameKey && explicitServiceNameKeys.includes(skill.serviceNameKey));
          return byServiceId || byServiceName;
        });
        const matchedWorkerSkillIds = matchedSkills
          .map(skill => skill.id)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
        const matchedServiceIds = matchedSkills
          .map(skill => skill.serviceId)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
        const workerServiceSkillIds = Array.isArray(raw.workerServiceSkillIds)
          ? raw.workerServiceSkillIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          : [];
        const workerServiceSkillId = typeof raw.workerServiceSkillId === 'string' && raw.workerServiceSkillId.trim().length > 0
          ? raw.workerServiceSkillId
          : null;

        return {
          ...card,
          allowedCertificateTypes: Array.isArray(card.allowedCertificateTypes) ? card.allowedCertificateTypes : [],
          serviceIds: explicitServiceIds.length > 0 ? explicitServiceIds : matchedServiceIds,
          serviceNames: Array.isArray(card.serviceNames) ? card.serviceNames : (card.serviceName ? [card.serviceName] : []),
          workerServiceIds: Array.isArray(card.workerServiceIds) ? card.workerServiceIds : (card.workerServiceId ? [card.workerServiceId] : []),
          workerSkillIds: Array.isArray(card.workerSkillIds)
            ? card.workerSkillIds
            : (card.workerSkillId
              ? [card.workerSkillId]
              : (workerServiceSkillIds.length > 0
                ? workerServiceSkillIds
                : (workerServiceSkillId ? [workerServiceSkillId] : matchedWorkerSkillIds))),
        };
      })
    : [];

  return {
    summary: statusData?.summary ?? undefined,
    skills: normalizedSkills,
    certificates: normalizedCards,
    requiredCertificates: normalizedCards,
  } as T;
}

export function getCachedWorkerHome(city: string): WorkerHomeData | null {
  return workerHomeCacheByCity.get(normalizeCity(city)) ?? null;
}

export async function getWorkerHome(city: string): Promise<WorkerHomeData> {
  const normalizedCity = normalizeCity(city);
  const response = await apiGet<ApiEnvelope<unknown>>(
    `/worker/home?city=${encodeURIComponent(normalizedCity)}`,
    {
      auth: true,
      retryOnAuthFailure: true,
      cache: 'no-store',
    },
  );
  const payload = normalizeWorkerHomeData(unwrapData(response));
  workerHomeCacheByCity.set(normalizedCity, payload);
  return payload;
}

export async function createWorkerServices(
  payload: WorkerServicePayload,
  options?: { showSuccessToast?: boolean; showErrorToast?: boolean },
) {
  const normalizedSkills = Array.isArray(payload.skills)
    ? payload.skills
    : (Array.isArray(payload.services) ? payload.services : []);
  const requestPayload = {
    city: payload.city,
    skills: normalizedSkills,
    services: Array.isArray(payload.services) ? payload.services : normalizedSkills,
  };

  const response = await apiPost<ApiEnvelope<unknown>, typeof requestPayload>(
    '/worker/skills',
    requestPayload,
    {
      auth: true,
      toast: {
        showSuccess: options?.showSuccessToast ?? false,
        showError: options?.showErrorToast ?? true,
        successTitle: 'Skills Saved',
        successMessage: 'Worker skills were saved.',
        errorTitle: 'Skill Save Failed',
      },
    },
  );
  const data = unwrapData(response);
  return normalizeWorkerServiceCreateResponse(data);
}

export async function updateWorkerServices(payload: WorkerServiceUpdatePayload) {
  const workerSkillId = payload.workerSkillId ?? payload.workerServiceId;
  const requestPayload = {
    workerSkillId,
    workerServiceId: payload.workerServiceId,
    cityId: payload.cityId,
    experienceYears: payload.experienceYears,
    priceOverride: payload.priceOverride,
    isAvailable: payload.isAvailable,
  };

  const response = await apiPatch<ApiEnvelope<unknown>, typeof requestPayload>(
    '/worker/skills',
    requestPayload,
    {
      auth: true,
      toast: {
        successTitle: 'Skill Updated',
        successMessage: 'Worker skill has been updated.',
        errorTitle: 'Skill Update Failed',
      },
    },
  );
  const data = unwrapData(response);
  return normalizeWorkerServiceUpdateResponse(data);
}

export async function createWorkerCertificates(payload: WorkerCertificateCreatePayload) {
  // Example: await createWorkerCertificates({ certificates: [{ certificateType: 'BEAUTY_WELLNESS_CERTIFICATE', workerSkillIds: ['uuid'], fileName: 'cert.jpg', fileType: 'image/jpeg', fileUrl: 'file:///...' }] });
  const normalizedCertificates = (payload.certificates ?? []).map(normalizeCertificatePayload);
  validateCertificatePayloadItems(normalizedCertificates, { requireAtLeastOne: true });
  const requestPayload: WorkerCertificateCreatePayload = {
    certificates: normalizedCertificates,
  };
  const formData = buildWorkerCertificatesFormData(requestPayload);
  const response = await apiPost<ApiEnvelope<unknown>, FormData>(
    '/worker/certificates',
    formData,
    {
      auth: true,
      toast: {
        successTitle: 'Certificate Added',
        successMessage: 'Worker certificate has been saved.',
        errorTitle: 'Certificate Save Failed',
      },
    },
  );
  return unwrapData(response);
}

export async function updateWorkerCertificates(payload: WorkerCertificateUpdatePayload) {
  // Example: await updateWorkerCertificates({ certificates: [{ certificateId: 'certificate-uuid', certificateType: 'BEAUTY_WELLNESS_CERTIFICATE', workerSkillIds: ['uuid'], fileId: 'file-uuid' }] });
  const normalizedCertificates = (payload.certificates ?? []).map(normalizeCertificatePayload);
  validateCertificatePayloadItems(normalizedCertificates);
  normalizedCertificates.forEach((item, index) => {
    if (!item.certificateId || item.certificateId.trim().length === 0) {
      throw new Error(`certificateId is required for certificate at index ${index}.`);
    }
  });
  const requestPayload: WorkerCertificateUpdatePayload = {
    certificates: normalizedCertificates,
  };
  const formData = buildWorkerCertificatesFormData(requestPayload);
  const response = await apiPatch<ApiEnvelope<unknown>, FormData>(
    '/worker/certificates',
    formData,
    {
      auth: true,
      toast: {
        successTitle: 'Certificate Updated',
        successMessage: 'Worker certificate was updated successfully.',
        errorTitle: 'Certificate Update Failed',
      },
    },
  );
  return unwrapData(response);
}
