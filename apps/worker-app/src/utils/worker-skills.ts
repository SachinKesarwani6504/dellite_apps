import type { CategoryService } from '@/types/auth';
import type { WorkerSkillStatusItem } from '@/types/worker-skills';

export function normalizeWorkerSkillLookupKey(value?: string | null): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function getUnselectedSelectableServices(
  services: CategoryService[],
  selectedServiceIds: Record<string, CategoryService>,
  existingSkillsByKey?: Record<string, WorkerSkillStatusItem>,
): CategoryService[] {
  return services.filter(service => {
    if (getExistingWorkerSkillForService(service, existingSkillsByKey)) {
      return false;
    }
    const normalizedServiceId = String(service.id ?? '').trim();
    if (!normalizedServiceId) {
      return false;
    }
    return !selectedServiceIds[normalizedServiceId];
  });
}

export function getExistingWorkerSkillsByKey(
  skills: WorkerSkillStatusItem[],
): Record<string, WorkerSkillStatusItem> {
  return skills.reduce<Record<string, WorkerSkillStatusItem>>((acc, skill) => {
    const serviceIdKey = normalizeWorkerSkillLookupKey(skill.serviceId);
    const serviceNameKey = normalizeWorkerSkillLookupKey(skill.serviceName);
    if (serviceIdKey) acc[`id:${serviceIdKey}`] = skill;
    if (serviceNameKey) acc[`name:${serviceNameKey}`] = skill;
    return acc;
  }, {});
}

export function getExistingWorkerSkillForService(
  service: CategoryService,
  existingSkillsByKey?: Record<string, WorkerSkillStatusItem>,
): WorkerSkillStatusItem | undefined {
  if (!existingSkillsByKey) return undefined;
  const serviceIdKey = normalizeWorkerSkillLookupKey(service.id);
  const serviceNameKey = normalizeWorkerSkillLookupKey(service.name);
  return existingSkillsByKey[`id:${serviceIdKey}`] ?? existingSkillsByKey[`name:${serviceNameKey}`];
}
