import type { CategoryService, ServiceCategory } from '@/types/auth';

export type WorkerSkillStatusItem = {
  id?: string;
  workerSkillId?: string;
  workerServiceId?: string;
  serviceId?: string;
  serviceName?: string;
  status?: string;
  isAvailable?: boolean;
  isCertificateRequired?: boolean;
  isCertificateAdded?: boolean;
};

export type WorkerSkillTreeSelectorProps = {
  categories: ServiceCategory[];
  selectedServiceIds: Record<string, CategoryService>;
  existingSkillsByKey?: Record<string, WorkerSkillStatusItem>;
  disabled?: boolean;
  isDark: boolean;
  onToggleService: (service: CategoryService) => void;
};

export type WorkerSelectedSkillStripProps = {
  selectedServices: CategoryService[];
  disabled?: boolean;
  isDark: boolean;
  onRemoveService: (service: CategoryService) => void;
};
