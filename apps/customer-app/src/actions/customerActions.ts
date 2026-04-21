import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import { ApiError, type ApiEnvelope } from '@/types/api';
import type {
  CustomerCatalogQuery,
  CustomerCatalogService,
  CustomerCatalogSubcategory,
  CreateCustomerProfileResponse,
  CustomerHomeCategory,
  CustomerHomeContentSection,
  CustomerHomePayload,
  CustomerHomeService,
  CustomerProfile,
  CustomerProfileResponse,
  CustomerServiceListItem,
  CustomerServicesListQuery,
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

function isCustomerHomeService(value: unknown): value is CustomerHomeService {
  if (!value || typeof value !== 'object') return false;
  const source = value as { id?: unknown; name?: unknown };
  return typeof source.id === 'string' && typeof source.name === 'string';
}

function isCustomerHomeCategory(value: unknown): value is CustomerHomeCategory {
  if (!value || typeof value !== 'object') return false;
  const source = value as { id?: unknown; name?: unknown };
  return typeof source.id === 'string' && typeof source.name === 'string';
}

function normalizeCustomerHomePayload(payload: CustomerHomePayload | Record<string, unknown>): CustomerHomePayload {
  const source = payload as CustomerHomePayload & {
    content?: unknown;
    why_dellite?: unknown;
  };
  const rawContent = Array.isArray(source.content) ? source.content : [];
  const normalizedContent: CustomerHomeContentSection[] = rawContent
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => {
      const title = typeof item.title === 'string' ? item.title : undefined;
      const type = typeof item.type === 'string' ? item.type : undefined;
      const data = Array.isArray(item.data) ? item.data : [];

      if (type === 'service') {
        return {
          title,
          type: 'service',
          data: data.filter(isCustomerHomeService),
        };
      }

      if (type === 'category') {
        return {
          title,
          type: 'category',
          data: data.filter(isCustomerHomeCategory),
        };
      }

      return {
        title,
        data: data
          .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
          .map(entry => ({ title: typeof entry.title === 'string' ? entry.title : undefined })),
      };
    });

  const popularServices = (
    normalizedContent.find(section => section.type === 'service')?.data ?? []
  ).filter(isCustomerHomeService);
  const allServices = (
    normalizedContent.find(section => section.type === 'category')?.data ?? []
  ).filter(isCustomerHomeCategory);

  const whyDelliteFromContent = normalizedContent
    .find(section => section.title?.trim().toLowerCase() === 'why dellite')
    ?.data
    ?.map((item) => {
      const source = item as { title?: unknown };
      return typeof source?.title === 'string' ? source.title : '';
    })
    .filter((item): item is string => item.trim().length > 0);

  const whyDelliteLegacy = Array.isArray(source.whyDellite)
    ? source.whyDellite
    : (Array.isArray(source.why_dellite) ? source.why_dellite : undefined);

  return {
    ...source,
    content: normalizedContent,
    popularServices,
    allServices,
    whyDellite: Array.isArray(whyDelliteFromContent) && whyDelliteFromContent.length > 0
      ? whyDelliteFromContent
      : (Array.isArray(whyDelliteLegacy)
        ? whyDelliteLegacy.filter((item): item is string => typeof item === 'string')
        : []),
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

function toServicesQueryString(query: CustomerServicesListQuery) {
  const params = new URLSearchParams();
  params.set('city', normalizeCityQuery(query.city));

  if (typeof query.search === 'string' && query.search.trim().length > 0) {
    params.set('search', query.search.trim());
  }

  // Pagination is opt-in: if page/limit are not sent, backend returns full list (legacy behavior).
  if (typeof query.page === 'number' && Number.isFinite(query.page)) {
    params.set('page', String(query.page));
  }
  if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
    params.set('limit', String(query.limit));
  }

  if (typeof query.includeCategory === 'boolean') {
    params.set('includeCategory', String(query.includeCategory));
  }
  if (typeof query.includeSubcategory === 'boolean') {
    params.set('includeSubcategory', String(query.includeSubcategory));
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
    const normalizedUsageTypes = query.usageType
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map(value => value.trim().toUpperCase());
    if (normalizedUsageTypes.length > 0) {
      params.set('usageType', normalizedUsageTypes.join(','));
    }
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
  if (!normalizedCity) {
    throw new Error('City query is required for customer home.');
  }
  const response = await apiGet<ApiEnvelope<CustomerHomePayload> | CustomerHomePayload>(
    `/customer/home?city=${encodeURIComponent(normalizedCity)}`,
    {
      auth: false,
      retryOnAuthFailure: false,
      cache: 'no-store',
    },
  );

  if (response && typeof response === 'object' && 'statusCode' in response) {
    const envelope = response as ApiEnvelope<CustomerHomePayload>;
    const statusCode = typeof envelope.statusCode === 'number' ? envelope.statusCode : 200;
    if (statusCode >= 400) {
      throw new ApiError(envelope.message ?? 'Unable to load customer home.', statusCode, envelope.data);
    }
  }

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

type RawCustomerServiceListCategory = Partial<Omit<CustomerHomeCategory, 'subcategories' | 'services'>> & {
  images?: unknown;
};

type RawCustomerServiceListSubcategory = Partial<CustomerCatalogSubcategory> & {
  images?: unknown;
};

type RawCustomerServiceListItem = Partial<CustomerServiceListItem> & {
  images?: unknown;
  category?: RawCustomerServiceListCategory;
  subCategory?: RawCustomerServiceListSubcategory;
};

function normalizeServiceListCategory(category: RawCustomerServiceListCategory) {
  const images = normalizeImageList(category.images);
  return {
    ...category,
    images,
    mainImage: pickImageByUsage(images, 'MAIN') ?? category.mainImage,
    iconImage: pickImageByUsage(images, 'ICON') ?? category.iconImage,
  } as CustomerHomeCategory;
}

function normalizeServiceListSubcategory(subCategory: RawCustomerServiceListSubcategory) {
  const images = normalizeImageList(subCategory.images);
  return {
    ...subCategory,
    images,
    mainImage: pickImageByUsage(images, 'MAIN') ?? subCategory.mainImage,
    iconImage: pickImageByUsage(images, 'ICON') ?? subCategory.iconImage,
  } as CustomerCatalogSubcategory;
}

function normalizeServiceListItem(item: RawCustomerServiceListItem): CustomerServiceListItem | null {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.id !== 'string' || typeof item.name !== 'string') return null;

  const images = normalizeImageList(item.images);
  return {
    id: item.id,
    name: item.name,
    description: typeof item.description === 'string' ? item.description : undefined,
    iconText: typeof item.iconText === 'string' ? item.iconText : undefined,
    isCertificateRequired: typeof item.isCertificateRequired === 'boolean' ? item.isCertificateRequired : undefined,
    images,
    mainImage: pickImageByUsage(images, 'MAIN') ?? item.mainImage,
    iconImage: pickImageByUsage(images, 'ICON') ?? item.iconImage,
    category: item.category && typeof item.category === 'object' ? normalizeServiceListCategory(item.category) : undefined,
    subCategory: item.subCategory && typeof item.subCategory === 'object' ? normalizeServiceListSubcategory(item.subCategory) : undefined,
    priceOptions: Array.isArray(item.priceOptions) ? item.priceOptions : undefined,
    includedTasks: Array.isArray(item.includedTasks) ? item.includedTasks : undefined,
    excludedTasks: Array.isArray(item.excludedTasks) ? item.excludedTasks : undefined,
  };
}

export async function getCustomerServices(query: CustomerServicesListQuery): Promise<CustomerServiceListItem[]> {
  const normalizedCity = normalizeCity(query.city);
  if (!normalizedCity) {
    throw new Error('City query is required for services.');
  }

  const qs = toServicesQueryString({ ...query, city: normalizedCity });
  const response = await apiGet<ApiEnvelope<RawCustomerServiceListItem[]> | RawCustomerServiceListItem[]>(
    `/services?${qs}`,
    {
      auth: false,
      retryOnAuthFailure: false,
      cache: 'no-store',
    },
  );

  if (response && typeof response === 'object' && 'statusCode' in response) {
    const envelope = response as ApiEnvelope<RawCustomerServiceListItem[]>;
    const statusCode = typeof envelope.statusCode === 'number' ? envelope.statusCode : 200;
    if (statusCode >= 400) {
      throw new ApiError(envelope.message ?? 'Unable to load services.', statusCode, envelope.data);
    }
  }

  const data = unwrapData(response) as RawCustomerServiceListItem[];
  if (!Array.isArray(data)) return [];

  return data
    .map(normalizeServiceListItem)
    .filter((item): item is CustomerServiceListItem => Boolean(item));
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
