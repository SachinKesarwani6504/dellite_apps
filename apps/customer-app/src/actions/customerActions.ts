import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  CustomerCatalogQuery,
  CustomerCatalogService,
  CustomerCatalogSubcategory,
  CreateCustomerProfileResponse,
  CustomerHomeCategory,
  CustomerHomePayload,
  CustomerProfile,
  CustomerProfileResponse,
  UpdateCustomerIdentityPayload,
  UpdateCustomerProfilePayload,
} from '@/types/customer';
import { toFormData } from '@/utils/form-data';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

const customerHomeCacheByCity = new Map<string, CustomerHomePayload>();

function normalizeCity(city: string) {
  return city.trim().toUpperCase();
}

function normalizeCustomerHomePayload(payload: CustomerHomePayload | Record<string, unknown>): CustomerHomePayload {
  const source = payload as CustomerHomePayload & { why_dellite?: unknown };
  const whyDellite = Array.isArray(source.whyDellite)
    ? source.whyDellite
    : (Array.isArray(source.why_dellite) ? source.why_dellite : undefined);

  return {
    ...source,
    whyDellite: Array.isArray(whyDellite) ? whyDellite.filter((item): item is string => typeof item === 'string') : [],
  };
}

type RawCustomerCategory = Omit<CustomerHomeCategory, 'subcategories' | 'services'> & {
  subcategories?: CustomerCatalogSubcategory[];
  subCategories?: CustomerCatalogSubcategory[];
  services?: CustomerCatalogService[];
};

function normalizeCityQuery(city: string) {
  return city.trim().toUpperCase();
}

function toQueryString(query: CustomerCatalogQuery) {
  const params = new URLSearchParams();
  params.set('city', normalizeCityQuery(query.city));
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
  if (typeof query.includeImage === 'boolean') {
    params.set('includeImage', String(query.includeImage));
  }
  if (Array.isArray(query.usageType) && query.usageType.length > 0) {
    params.set('usageType', query.usageType.join(','));
  }
  return params.toString();
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return false;
}

function normalizeCatalogService(service: CustomerCatalogService) {
  const raw = service as CustomerCatalogService & Record<string, unknown>;
  const images = normalizeImageList(raw.images);
  return {
    ...service,
    images,
    mainImage: pickImageByUsage(images, 'MAIN') ?? service.mainImage,
    iconImage: pickImageByUsage(images, 'ICON') ?? service.iconImage,
    isCertificateRequired: toBoolean(
      raw.isCertificateRequired
        ?? raw.is_certificate_required
        ?? raw.requiresCertificate
        ?? raw.requires_certificate,
    ),
  };
}

function normalizeImageList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is NonNullable<CustomerCatalogService['images']>[number] => {
    return Boolean(item && typeof item === 'object');
  });
}

function pickImageByUsage(images: NonNullable<CustomerCatalogService['images']>, usageType: 'MAIN' | 'ICON') {
  return images.find(image => image.usageType?.toUpperCase() === usageType);
}

function normalizeCatalogSubcategory(subcategory: CustomerCatalogSubcategory) {
  const images = normalizeImageList((subcategory as CustomerCatalogSubcategory & Record<string, unknown>).images);
  return {
    ...subcategory,
    images,
    mainImage: pickImageByUsage(images, 'MAIN') ?? subcategory.mainImage,
    iconImage: pickImageByUsage(images, 'ICON') ?? subcategory.iconImage,
    services: Array.isArray(subcategory.services) ? subcategory.services.map(normalizeCatalogService) : [],
  };
}

function normalizeCatalogCategory(category: RawCustomerCategory) {
  const images = normalizeImageList((category as RawCustomerCategory & Record<string, unknown>).images);
  const normalizedSubcategories = Array.isArray(category.subcategories)
    ? category.subcategories
    : (Array.isArray(category.subCategories) ? category.subCategories : []);

  const normalizedServices = Array.isArray(category.services)
    ? category.services.map(normalizeCatalogService)
    : [];

  return {
    ...category,
    images,
    mainImage: pickImageByUsage(images, 'MAIN') ?? category.mainImage,
    iconImage: pickImageByUsage(images, 'ICON') ?? category.iconImage,
    services: normalizedServices,
    subcategories: normalizedSubcategories.map(normalizeCatalogSubcategory),
  };
}

export async function getCustomerProfile(): Promise<CustomerProfile> {
  const response = await apiGet<ApiEnvelope<CustomerProfileResponse> | CustomerProfileResponse>(
    '/customer/profile',
    { auth: true },
  );
  return unwrapData(response).profile;
}

export function getCachedCustomerHome(city: string): CustomerHomePayload | null {
  const cacheKey = normalizeCity(city);
  return customerHomeCacheByCity.get(cacheKey) ?? null;
}

export async function getCustomerHome(city: string): Promise<CustomerHomePayload> {
  const normalizedCity = normalizeCity(city);
  const response = await apiGet<ApiEnvelope<CustomerHomePayload> | CustomerHomePayload>(
    `/customer/home?city=${encodeURIComponent(normalizedCity)}`,
    {
      auth: false,
      retryOnAuthFailure: false,
      cache: 'no-store',
    },
  );

  const payload = normalizeCustomerHomePayload(unwrapData(response) as CustomerHomePayload | Record<string, unknown>);
  customerHomeCacheByCity.set(normalizedCity, payload);
  return payload;
}

export async function getCustomerServiceCatalog(query: CustomerCatalogQuery) {
  const qs = toQueryString(query);
  const response = await apiGet<ApiEnvelope<RawCustomerCategory[]> | RawCustomerCategory[]>(`/categories?${qs}`, {
    auth: false,
    retryOnAuthFailure: false,
    cache: 'no-store',
  });

  const data = unwrapData(response) as RawCustomerCategory[];
  if (!Array.isArray(data)) return [];

  return data
    .filter((item): item is RawCustomerCategory => Boolean(item && typeof item === 'object'))
    .map(normalizeCatalogCategory);
}

export async function createCustomerProfile(
  payload: UpdateCustomerIdentityPayload,
): Promise<CreateCustomerProfileResponse> {
  // Example: await createCustomerProfile({ firstName: 'Sachin', gender: 'MALE', file: { uri, name, type } });
  const formData = toFormData(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      gender: payload.gender,
      referralCode: payload.referralCode,
    },
    payload.file ? { file: payload.file } : undefined,
  );

  const response = await apiPost<
    ApiEnvelope<CreateCustomerProfileResponse> | CreateCustomerProfileResponse,
    FormData
  >('/customer/profile', formData, {
    tokenType: 'phone',
    retryOnAuthFailure: false,
  });

  return unwrapData(response);
}

export async function updateCustomerProfile(payload: UpdateCustomerProfilePayload): Promise<void> {
  // Example: await updateCustomerProfile({ preferredLanguage: 'EN', hasSeenOnboardingWelcomeScreen: true });
  const formData = toFormData(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      gender: payload.gender,
      preferredLanguage: payload.preferredLanguage,
      hasSeenOnboardingWelcomeScreen: payload.hasSeenOnboardingWelcomeScreen,
    },
    payload.file ? { file: payload.file } : undefined,
  );

  await apiPatch<{ profile?: CustomerProfile }, FormData>(
    '/customer/profile',
    formData,
    {
      auth: true,
      toast: {
        successMessage: 'Profile updated successfully',
      },
    },
  );
}

export async function markOnboardingWelcomeSeen(): Promise<void> {
  const formData = toFormData({ hasSeenOnboardingWelcomeScreen: true });
  await apiPatch<{ profile?: CustomerProfile }, FormData>(
    '/customer/profile',
    formData,
    {
      auth: true,
      toast: {
        enabled: false,
        showSuccess: false,
        showError: false,
      },
    },
  );
}
