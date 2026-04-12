import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import { ApiEnvelope } from '@/types/api';
import { ApiError } from '@/types/api';
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
  WorkerStatusData,
  WorkerStatusResponse,
} from '@/types/auth';
import { normalizeCertificatePayload, validateCertificatePayloadItems } from '@/utils/certificate-payload';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

type RawServiceSubcategory = Omit<ServiceSubcategory, 'services'> & {
  services?: CategoryService[];
};

type RawServiceCategory = Omit<ServiceCategory, 'subcategories'> & {
  subcategories?: RawServiceSubcategory[];
  subCategories?: RawServiceSubcategory[];
};

type WorkerStatusEnvelopeOrData = WorkerStatusResponse | WorkerStatusData;
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
  const response = await apiPost<ApiEnvelope<unknown>, WorkerProfilePayload>(
    '/worker/profile',
    payload,
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
  const response = await apiPatch<ApiEnvelope<unknown>, Partial<WorkerProfilePayload>>(
    '/worker/profile',
    payload,
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

export async function getWorkerStatus<T = WorkerStatusData>() {
  let data: WorkerStatusEnvelopeOrData;
  try {
    const response = await apiGet<ApiEnvelope<WorkerStatusEnvelopeOrData>>('/worker/certificate/status', { auth: true });
    data = unwrapData(response) as WorkerStatusEnvelopeOrData;
  } catch (error) {
    const shouldFallback = error instanceof ApiError && error.statusCode === 404;
    if (!shouldFallback) {
      throw error;
    }
    const fallbackResponse = await apiGet<ApiEnvelope<WorkerStatusEnvelopeOrData>>(
      '/worker/skills/status?includeCertificate=true',
      { auth: true },
    );
    data = unwrapData(fallbackResponse) as WorkerStatusEnvelopeOrData;
  }

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
  const normalizedCertificates = (payload.certificates ?? []).map(normalizeCertificatePayload);
  validateCertificatePayloadItems(normalizedCertificates, { requireAtLeastOne: true });
  const requestPayload: WorkerCertificateCreatePayload = {
    certificates: normalizedCertificates,
  };
  const response = await apiPost<ApiEnvelope<unknown>, WorkerCertificateCreatePayload>(
    '/worker/certificates',
    requestPayload,
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
  const normalizedCertificates = (payload.certificates ?? []).map(normalizeCertificatePayload);
  validateCertificatePayloadItems(normalizedCertificates);
  const requestPayload: WorkerCertificateUpdatePayload = {
    certificates: normalizedCertificates,
  };
  const response = await apiPatch<ApiEnvelope<unknown>, WorkerCertificateUpdatePayload>(
    '/worker/certificates',
    requestPayload,
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
