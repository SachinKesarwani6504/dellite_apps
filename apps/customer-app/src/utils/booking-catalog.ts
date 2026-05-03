import type {
  CustomerBookableService,
  CustomerCatalogSubcategory,
  CustomerHomeCategory,
  CustomerServiceListItem,
} from '@/types/customer';
import { safeImageUrl } from '@/utils/home';

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
