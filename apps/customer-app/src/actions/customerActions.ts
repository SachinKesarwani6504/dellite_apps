import { apiGet, apiPatch, apiPost } from '@/actions/http/httpClient';
import { ApiError, type ApiEnvelope } from '@/types/api';
import type {
  CustomerCategoryDetailQuery,
  CustomerCatalogQuery,
  CustomerCatalogService,
  CustomerCatalogSubcategory,
  CustomerBookingCreateResult,
  CustomerServiceDetailQuery,
  CreateCustomerProfileResponse,
  CreateCustomerBookingPayload,
  CustomerBookableService,
  CustomerHomeCategory,
  CustomerHomeContentSection,
  CustomerHomePayload,
  CustomerHomeService,
  CustomerImageUsageType,
  CustomerProfile,
  CustomerProfileResponse,
  CustomerServiceListItem,
  CustomerServicePriceOption,
  CustomerServiceTask,
  CustomerSubcategoryDetailQuery,
  CustomerSubcategoryListQuery,
  CustomerServicesListQuery,
  UpdateCustomerIdentityPayload,
  UpdateCustomerProfilePayload,
} from '@/types/customer';
import {
  PRICE_COMPUTATION_MODE,
  PRICE_TYPE,
  ROUNDING_MODE,
  SERVICE_TASK_TYPE,
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

function requireCity(city: string, endpointLabel: string) {
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) {
    throw new Error(`City query is required for ${endpointLabel}.`);
  }
  return normalizedCity;
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

function normalizePage(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(1, Math.floor(value));
}

function normalizeLimit(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(1, Math.floor(value)));
}

function appendIncludeParams(params: URLSearchParams, query: {
  includeCategory?: boolean;
  includeSubcategory?: boolean;
  includeServices?: boolean;
  includePriceOptions?: boolean;
  includeTask?: boolean;
  includeImage?: boolean;
  usageType?: CustomerImageUsageType[];
}) {
  if (typeof query.includeCategory === 'boolean') {
    params.set('includeCategory', String(query.includeCategory));
  }
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
    const normalizedUsageTypes = query.usageType
      .map(value => value.trim().toUpperCase())
      .filter(value => value.length > 0);
    if (normalizedUsageTypes.length > 0) {
      params.set('usageType', normalizedUsageTypes.join(','));
    }
  }
}

function toCategoriesQueryString(query: CustomerCatalogQuery | CustomerCategoryDetailQuery) {
  const params = new URLSearchParams();
  params.set('city', normalizeCityQuery(query.city));
  if ('categoryName' in query && typeof query.categoryName === 'string' && query.categoryName.trim().length > 0) {
    params.set('categoryName', query.categoryName.trim());
  }
  if ('serviceName' in query && typeof query.serviceName === 'string' && query.serviceName.trim().length > 0) {
    params.set('serviceName', query.serviceName.trim());
  }
  appendIncludeParams(params, query);
  return params.toString();
}

function toServicesQueryString(query: CustomerServicesListQuery) {
  const params = new URLSearchParams();
  params.set('city', normalizeCityQuery(query.city));

  if (typeof query.search === 'string' && query.search.trim().length > 0) {
    params.set('search', query.search.trim());
  }
  if (typeof query.categoryName === 'string' && query.categoryName.trim().length > 0) {
    params.set('categoryName', query.categoryName.trim());
  }
  if (typeof query.serviceName === 'string' && query.serviceName.trim().length > 0) {
    params.set('serviceName', query.serviceName.trim());
  }

  // Pagination is opt-in: if page/limit are not sent, backend returns full list (legacy behavior).
  const page = normalizePage(query.page);
  const limit = normalizeLimit(query.limit);
  if (page != null) params.set('page', String(page));
  if (limit != null) params.set('limit', String(limit));

  appendIncludeParams(params, query);

  return params.toString();
}

function toSubcategoriesQueryString(query: CustomerSubcategoryListQuery | CustomerSubcategoryDetailQuery) {
  const params = new URLSearchParams();
  params.set('city', normalizeCityQuery(query.city));
  if ('search' in query && typeof query.search === 'string' && query.search.trim().length > 0) {
    params.set('search', query.search.trim());
  }
  if ('categoryName' in query && typeof query.categoryName === 'string' && query.categoryName.trim().length > 0) {
    params.set('categoryName', query.categoryName.trim());
  }
  if ('serviceName' in query && typeof query.serviceName === 'string' && query.serviceName.trim().length > 0) {
    params.set('serviceName', query.serviceName.trim());
  }
  if ('page' in query) {
    const page = normalizePage(query.page);
    if (page != null) params.set('page', String(page));
  }
  if ('limit' in query) {
    const limit = normalizeLimit(query.limit);
    if (limit != null) params.set('limit', String(limit));
  }
  appendIncludeParams(params, query);
  return params.toString();
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return false;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toEnumValue<T extends string>(value: unknown, allowedValues: readonly T[]): T | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  return allowedValues.find((item) => item === normalized as T);
}

function normalizeCatalogService(service: CustomerCatalogService) {
  const raw = service as CustomerCatalogService & Record<string, unknown>;
  const images = normalizeImageList(raw.images);
  const iconImage = pickExplicitImage(raw, 'iconImage') ?? pickImageByUsage(images, 'ICON') ?? service.iconImage;
  const cardImage = pickExplicitImage(raw, 'cardImage') ?? pickImageByUsage(images, 'MAIN') ?? (raw.mainImage as CustomerCatalogService['mainImage']) ?? service.mainImage;
  const bannerImage = pickExplicitImage(raw, 'bannerImage') ?? pickImageByUsage(images, 'BANNER');
  return {
    ...service,
    images,
    iconImage,
    cardImage,
    bannerImage,
    mainImage: cardImage,
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

function pickImageByUsage(images: NonNullable<CustomerCatalogService['images']>, usageType: 'MAIN' | 'ICON' | 'BANNER') {
  return images.find(image => image.usageType?.toUpperCase() === usageType);
}

function pickExplicitImage(
  raw: Record<string, unknown>,
  field: 'iconImage' | 'cardImage' | 'bannerImage',
) {
  const candidate = raw[field];
  if (candidate && typeof candidate === 'object') {
    return candidate as CustomerCatalogService['iconImage'];
  }
  return undefined;
}

function normalizePriceOption(value: unknown): CustomerServicePriceOption | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string') return null;

  const titleCandidates = [raw.title, raw.name, raw.label];
  const title = titleCandidates.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (!title) return null;

  const amount = toOptionalNumber(raw.amount) ?? toOptionalNumber(raw.price);

  return {
    id: raw.id,
    serviceAvailabilityId: typeof raw.serviceAvailabilityId === 'string' ? raw.serviceAvailabilityId : undefined,
    title: title.trim(),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    price: amount,
    priceType: toEnumValue(raw.priceType, Object.values(PRICE_TYPE)),
    minMinutes: toOptionalNumber(raw.minMinutes) ?? null,
    maxMinutes: toOptionalNumber(raw.maxMinutes) ?? null,
    billingUnitMinutes: toOptionalNumber(raw.billingUnitMinutes) ?? null,
    roundingMode: toEnumValue(raw.roundingMode, Object.values(ROUNDING_MODE)) ?? null,
    priceComputationMode: toEnumValue(raw.priceComputationMode, Object.values(PRICE_COMPUTATION_MODE)) ?? null,
    estimatedMinutes: toOptionalNumber(raw.estimatedMinutes) ?? null,
    isOptional: toBoolean(raw.isOptional),
    isActive: toBoolean(raw.isActive),
    isDeleted: toBoolean(raw.isDeleted),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

function normalizeTaskItem(value: unknown, defaultType?: CustomerServiceTask['type']): CustomerServiceTask | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const titleCandidates = [raw.title, raw.name, raw.label];
  const title = titleCandidates.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (!title) return null;

  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    title: title.trim(),
    type: toEnumValue(raw.type, Object.values(SERVICE_TASK_TYPE)) ?? defaultType,
    order: toOptionalNumber(raw.order),
  };
}

function normalizeCatalogSubcategory(subcategory: CustomerCatalogSubcategory) {
  const raw = subcategory as CustomerCatalogSubcategory & Record<string, unknown>;
  const images = normalizeImageList(raw.images);
  const iconImage = pickExplicitImage(raw, 'iconImage') ?? pickImageByUsage(images, 'ICON') ?? subcategory.iconImage;
  const cardImage = pickExplicitImage(raw, 'cardImage') ?? pickImageByUsage(images, 'MAIN') ?? (raw.mainImage as CustomerCatalogSubcategory['mainImage']) ?? subcategory.mainImage;
  const bannerImage = pickExplicitImage(raw, 'bannerImage') ?? pickImageByUsage(images, 'BANNER');
  return {
    ...subcategory,
    images,
    iconImage,
    cardImage,
    bannerImage,
    mainImage: cardImage,
    services: Array.isArray(subcategory.services) ? subcategory.services.map(normalizeBookableService) : [],
  };
}

function normalizeCatalogCategory(category: RawCustomerCategory) {
  const raw = category as RawCustomerCategory & Record<string, unknown>;
  const images = normalizeImageList(raw.images);
  const iconImage = pickExplicitImage(raw, 'iconImage') ?? pickImageByUsage(images, 'ICON') ?? category.iconImage;
  const cardImage = pickExplicitImage(raw, 'cardImage') ?? pickImageByUsage(images, 'MAIN') ?? (raw.mainImage as CustomerHomeCategory['mainImage']) ?? category.mainImage;
  const bannerImage = pickExplicitImage(raw, 'bannerImage') ?? pickImageByUsage(images, 'BANNER');
  const normalizedSubcategories = Array.isArray(category.subcategories)
    ? category.subcategories
    : (Array.isArray(category.subCategories) ? category.subCategories : []);

  const normalizedServices = Array.isArray(category.services)
    ? category.services.map(normalizeCatalogService)
    : [];

  return {
    ...category,
    images,
    iconImage,
    cardImage,
    bannerImage,
    mainImage: cardImage,
    services: normalizedServices.map(normalizeBookableService),
    subcategories: normalizedSubcategories.map(normalizeCatalogSubcategory),
  };
}

function normalizeBookableService(service: CustomerCatalogService): CustomerBookableService {
  const normalized = normalizeCatalogService(service);
  const raw = service as CustomerCatalogService & Record<string, unknown>;

  return {
    ...normalized,
    priceOptions: Array.isArray(raw.priceOptions)
      ? raw.priceOptions.map(normalizePriceOption).filter((item): item is CustomerServicePriceOption => Boolean(item))
      : [],
    includedTasks: Array.isArray(raw.includedTasks)
      ? raw.includedTasks.map(item => normalizeTaskItem(item, SERVICE_TASK_TYPE.INCLUDED)).filter((item): item is CustomerServiceTask => Boolean(item))
      : [],
    excludedTasks: Array.isArray(raw.excludedTasks)
      ? raw.excludedTasks.map(item => normalizeTaskItem(item, SERVICE_TASK_TYPE.EXCLUDED)).filter((item): item is CustomerServiceTask => Boolean(item))
      : [],
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
  requireCity(query.city, 'categories');
  const qs = toCategoriesQueryString(query);
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

export async function getCustomerCategoryById(categoryId: string, query: CustomerCategoryDetailQuery) {
  const normalizedCategoryId = categoryId.trim();
  if (!normalizedCategoryId) {
    throw new Error('categoryId is required for category detail.');
  }
  const normalizedCity = requireCity(query.city, 'category detail');
  void normalizedCity;
  const qs = toCategoriesQueryString(query);
  const response = await apiGet<ApiEnvelope<RawCustomerCategory> | RawCustomerCategory>(
    `/categories/${encodeURIComponent(normalizedCategoryId)}?${qs}`,
    {
      auth: false,
      retryOnAuthFailure: false,
      cache: 'no-store',
    },
  );
  const data = unwrapData(response) as RawCustomerCategory;
  if (!data || typeof data !== 'object') {
    throw new Error('Category detail is unavailable right now.');
  }
  return normalizeCatalogCategory(data);
}

export async function getCustomerSubcategories(query: CustomerSubcategoryListQuery): Promise<CustomerCatalogSubcategory[]> {
  const normalizedCity = requireCity(query.city, 'subcategories');
  void normalizedCity;
  const qs = toSubcategoriesQueryString(query);
  const response = await apiGet<ApiEnvelope<CustomerCatalogSubcategory[]> | CustomerCatalogSubcategory[]>(
    `/subcategories?${qs}`,
    {
      auth: false,
      retryOnAuthFailure: false,
      cache: 'no-store',
    },
  );
  const data = unwrapData(response) as CustomerCatalogSubcategory[];
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is CustomerCatalogSubcategory => Boolean(item && typeof item === 'object'))
    .map(normalizeCatalogSubcategory);
}

export async function getCustomerSubcategoryById(subCategoryId: string, query: CustomerSubcategoryDetailQuery) {
  const normalizedSubcategoryId = subCategoryId.trim();
  if (!normalizedSubcategoryId) {
    throw new Error('subCategoryId is required for subcategory detail.');
  }
  const normalizedCity = requireCity(query.city, 'subcategory detail');
  void normalizedCity;
  const qs = toSubcategoriesQueryString(query);
  const response = await apiGet<ApiEnvelope<CustomerCatalogSubcategory> | CustomerCatalogSubcategory>(
    `/subcategories/${encodeURIComponent(normalizedSubcategoryId)}?${qs}`,
    {
      auth: false,
      retryOnAuthFailure: false,
      cache: 'no-store',
    },
  );
  const data = unwrapData(response) as CustomerCatalogSubcategory;
  if (!data || typeof data !== 'object') {
    throw new Error('Subcategory detail is unavailable right now.');
  }
  return normalizeCatalogSubcategory(data);
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
  const raw = category as RawCustomerServiceListCategory & Record<string, unknown>;
  const images = normalizeImageList(category.images);
  const iconImage = pickExplicitImage(raw, 'iconImage') ?? pickImageByUsage(images, 'ICON') ?? category.iconImage;
  const cardImage = pickExplicitImage(raw, 'cardImage') ?? pickImageByUsage(images, 'MAIN') ?? (raw.mainImage as CustomerHomeCategory['mainImage']) ?? category.mainImage;
  const bannerImage = pickExplicitImage(raw, 'bannerImage') ?? pickImageByUsage(images, 'BANNER');
  return {
    ...category,
    images,
    iconImage,
    cardImage,
    bannerImage,
    mainImage: cardImage,
  } as CustomerHomeCategory;
}

function normalizeServiceListSubcategory(subCategory: RawCustomerServiceListSubcategory) {
  const raw = subCategory as RawCustomerServiceListSubcategory & Record<string, unknown>;
  const images = normalizeImageList(subCategory.images);
  const iconImage = pickExplicitImage(raw, 'iconImage') ?? pickImageByUsage(images, 'ICON') ?? subCategory.iconImage;
  const cardImage = pickExplicitImage(raw, 'cardImage') ?? pickImageByUsage(images, 'MAIN') ?? (raw.mainImage as CustomerCatalogSubcategory['mainImage']) ?? subCategory.mainImage;
  const bannerImage = pickExplicitImage(raw, 'bannerImage') ?? pickImageByUsage(images, 'BANNER');
  return {
    ...subCategory,
    images,
    iconImage,
    cardImage,
    bannerImage,
    mainImage: cardImage,
  } as CustomerCatalogSubcategory;
}

function normalizeServiceListItem(item: RawCustomerServiceListItem): CustomerServiceListItem | null {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.id !== 'string' || typeof item.name !== 'string') return null;

  const images = normalizeImageList(item.images);
  const raw = item as RawCustomerServiceListItem & Record<string, unknown>;
  const iconImage = pickExplicitImage(raw, 'iconImage') ?? pickImageByUsage(images, 'ICON') ?? item.iconImage;
  const cardImage = pickExplicitImage(raw, 'cardImage') ?? pickImageByUsage(images, 'MAIN') ?? (raw.mainImage as CustomerServiceListItem['mainImage']) ?? item.mainImage;
  const bannerImage = pickExplicitImage(raw, 'bannerImage') ?? pickImageByUsage(images, 'BANNER');
  return {
    id: item.id,
    name: item.name,
    description: typeof item.description === 'string' ? item.description : undefined,
    iconText: typeof item.iconText === 'string' ? item.iconText : undefined,
    isCertificateRequired: typeof item.isCertificateRequired === 'boolean' ? item.isCertificateRequired : undefined,
    images,
    iconImage,
    cardImage,
    bannerImage,
    mainImage: cardImage,
    category: item.category && typeof item.category === 'object' ? normalizeServiceListCategory(item.category) : undefined,
    subCategory: item.subCategory && typeof item.subCategory === 'object' ? normalizeServiceListSubcategory(item.subCategory) : undefined,
    priceOptions: Array.isArray(item.priceOptions)
      ? item.priceOptions.map(normalizePriceOption).filter((entry): entry is CustomerServicePriceOption => Boolean(entry))
      : [],
    includedTasks: Array.isArray(item.includedTasks)
      ? item.includedTasks.map(entry => normalizeTaskItem(entry, SERVICE_TASK_TYPE.INCLUDED)).filter((entry): entry is CustomerServiceTask => Boolean(entry))
      : [],
    excludedTasks: Array.isArray(item.excludedTasks)
      ? item.excludedTasks.map(entry => normalizeTaskItem(entry, SERVICE_TASK_TYPE.EXCLUDED)).filter((entry): entry is CustomerServiceTask => Boolean(entry))
      : [],
  };
}

export async function getCustomerServices(query: CustomerServicesListQuery): Promise<CustomerServiceListItem[]> {
  const normalizedCity = requireCity(query.city, 'services');

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

export async function getCustomerServiceById(serviceId: string, query: CustomerServiceDetailQuery): Promise<CustomerServiceListItem> {
  const normalizedServiceId = serviceId.trim();
  if (!normalizedServiceId) {
    throw new Error('serviceId is required for service detail.');
  }
  const normalizedCity = requireCity(query.city, 'service detail');
  const qs = toServicesQueryString({
    city: normalizedCity,
    includeCategory: query.includeCategory,
    includeSubcategory: query.includeSubcategory,
    includePriceOptions: query.includePriceOptions,
    includeTask: query.includeTask,
    includeImage: query.includeImage,
    usageType: query.usageType,
  });
  const response = await apiGet<ApiEnvelope<RawCustomerServiceListItem> | RawCustomerServiceListItem>(
    `/services/${encodeURIComponent(normalizedServiceId)}?${qs}`,
    {
      auth: false,
      retryOnAuthFailure: false,
      cache: 'no-store',
    },
  );
  const data = unwrapData(response) as RawCustomerServiceListItem;
  const normalized = normalizeServiceListItem(data);
  if (!normalized) {
    throw new Error('Service detail is unavailable right now.');
  }
  return normalized;
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

export async function createCustomerBooking(payload: CreateCustomerBookingPayload): Promise<CustomerBookingCreateResult> {
  const response = await apiPost<ApiEnvelope<CustomerBookingCreateResult> | CustomerBookingCreateResult, CreateCustomerBookingPayload>(
    '/booking',
    payload,
    {
      auth: true,
    },
  );

  return unwrapData(response);
}
