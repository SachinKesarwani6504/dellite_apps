import type {
  CustomerBookableService,
  CustomerServicePriceOption,
  CustomerCatalogSubcategory,
  CustomerHomeCategory,
  CustomerServiceListItem,
} from '@/types/customer';
import { safeImageUrl } from '@/utils/home';
import { PRICE_COMPUTATION_MODE, PRICE_TYPE } from '@/types/customer';
import { formatPriceOptionPricingLabel } from '@/utils/booking-flow';

export function pickServiceImage(service: CustomerServiceListItem) {
  return safeImageUrl(service.cardImage?.url)
    ?? safeImageUrl(service.bannerImage?.url)
    ?? safeImageUrl(service.iconImage?.url)
    ?? safeImageUrl(service.mainImage?.url)
    ?? safeImageUrl(service.images?.[0]?.url);
}

export function findCategoryById(categories: CustomerHomeCategory[], categoryId?: string) {
  if (!categoryId) return null;
  return categories.find(category => category.id === categoryId) ?? null;
}

export function findCategoryByService(categories: CustomerHomeCategory[], serviceId?: string) {
  if (!serviceId) return null;
  return categories.find(category =>
    Array.isArray(category.subcategories)
      && category.subcategories.some(subcategory =>
        Array.isArray(subcategory.services) && subcategory.services.some(service => service.id === serviceId),
      ),
  ) ?? null;
}

export function resolveSubcategoryById(category: CustomerHomeCategory | null, subcategoryId?: string) {
  if (!category || !subcategoryId || !Array.isArray(category.subcategories)) return null;
  return category.subcategories.find(subcategory => subcategory.id === subcategoryId) ?? null;
}

export function findSubcategoryByService(category: CustomerHomeCategory | null, serviceId?: string) {
  if (!category || !serviceId || !Array.isArray(category.subcategories)) return null;
  return category.subcategories.find(subcategory =>
    Array.isArray(subcategory.services) && subcategory.services.some(service => service.id === serviceId),
  ) ?? null;
}

export function getSubcategoryServiceCount(subcategory: CustomerCatalogSubcategory) {
  if (Array.isArray(subcategory.services)) return subcategory.services.length;
  if (typeof subcategory.serviceCount === 'string') {
    const parsed = Number(subcategory.serviceCount);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof subcategory.serviceCount === 'number' && Number.isFinite(subcategory.serviceCount)) {
    return subcategory.serviceCount;
  }
  return 0;
}

export function isCustomerBookableService(value: unknown): value is CustomerBookableService {
  if (!value || typeof value !== 'object') return false;
  const source = value as { id?: unknown; name?: unknown };
  return typeof source.id === 'string' && typeof source.name === 'string';
}

function toNumericPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function getPrimaryServicePriceOption(service: CustomerBookableService): CustomerServicePriceOption | null {
  const firstOption = Array.isArray(service.priceOptions) ? service.priceOptions[0] : null;
  if (!firstOption) return null;
  const price = toNumericPrice(firstOption.price);
  if (price == null) return null;
  const rawType = typeof firstOption.priceType === 'string' ? firstOption.priceType.toUpperCase() : '';
  if (rawType === 'FIXED') {
    return {
      id: firstOption.id ?? '',
      title: firstOption.title ?? '',
      price,
      priceType: PRICE_TYPE.VISIT,
      priceComputationMode: PRICE_COMPUTATION_MODE.FLAT,
      minMinutes: 60,
      maxMinutes: 60,
      isOptional: false,
    };
  }
  return {
    id: firstOption.id ?? '',
    title: firstOption.title ?? '',
    price,
    priceType: firstOption.priceType ?? PRICE_TYPE.VISIT,
    priceComputationMode: firstOption.priceComputationMode ?? PRICE_COMPUTATION_MODE.FLAT,
  };
}

export function getServiceCardPricingLabel(service: CustomerBookableService): string | null {
  const option = getPrimaryServicePriceOption(service);
  if (!option) return null;
  return formatPriceOptionPricingLabel(option);
}

export function getServiceCardPriceTypeLabel(service: CustomerBookableService): string | null {
  const firstOption = Array.isArray(service.priceOptions) ? service.priceOptions[0] : null;
  const rawType = typeof firstOption?.priceType === 'string' ? firstOption.priceType.toUpperCase() : '';
  if (!rawType) return null;
  if (rawType === 'FIXED') return 'Fixed';
  if (rawType === PRICE_TYPE.VISIT) return 'Visit';
  if (rawType === PRICE_TYPE.HOURLY) return 'Hourly';
  if (rawType === PRICE_TYPE.DAILY) return 'Daily';
  if (rawType === PRICE_TYPE.PER_UNIT) return 'Per unit';
  return null;
}
