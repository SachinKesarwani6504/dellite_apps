import type { CategoryService, ServiceSubcategory } from '@/types/auth';

export function normalizeServices(subcategory?: ServiceSubcategory): CategoryService[] {
  return Array.isArray(subcategory?.services) ? subcategory.services : [];
}

export function toIconBadgeText(name: string, iconText?: string): string {
  if (iconText?.trim()) return iconText.trim();
  return name.trim().charAt(0).toUpperCase() || '?';
}
