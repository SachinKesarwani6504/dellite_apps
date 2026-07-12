import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategories, getWorkerStatus, updateWorkerServices } from '@/actions';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { CategoryService, ServiceCategory } from '@/types/auth';
import type { WorkerSkillStatusItem } from '@/types/worker-skills';
import { getExistingWorkerSkillsByKey } from '@/utils';

const DEFAULT_CITY = 'PRAYAGRAJ';

export function useSkillManagerController(options?: { onSaveSuccess?: () => void }) {
  const onSaveSuccess = options?.onSaveSuccess;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [existingSkills, setExistingSkills] = useState<WorkerSkillStatusItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Record<string, CategoryService>>({});

  const loadSkillSetup = useCallback(async (loadOptions?: { showFullScreenLoader?: boolean }) => {
    const showFullScreenLoader = loadOptions?.showFullScreenLoader ?? true;
    try {
      if (showFullScreenLoader) setLoading(true);
      const [categoriesResponse, statusResponse] = await Promise.all([
        getCategories({
          city: DEFAULT_CITY,
          includeSubcategory: true,
          includeServices: true,
          includePriceOptions: true,
        }),
        getWorkerStatus({ sortBy: 'status', direction: 'asc' }),
      ]);
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      setExistingSkills(Array.isArray(statusResponse.skills) ? statusResponse.skills : []);
      setLoadError(false);
    } catch {
      setCategories([]);
      setExistingSkills([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSkillSetup({ showFullScreenLoader: true });
  }, [loadSkillSetup]);

  const refreshSkillSetup = useCallback(async () => {
    if (loading || submitting) return;
    await loadSkillSetup({ showFullScreenLoader: false });
  }, [loadSkillSetup, loading, submitting]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshSkillSetup);

  const existingSkillsByKey = useMemo(
    () => getExistingWorkerSkillsByKey(existingSkills),
    [existingSkills],
  );
  const selectedServices = useMemo(() => Object.values(selectedServiceIds), [selectedServiceIds]);
  const selectedServiceNames = useMemo(
    () => selectedServices.map(service => service.name),
    [selectedServices],
  );

  const onToggleService = useCallback((service: CategoryService) => {
    if (submitting) return;
    const normalizedServiceId = String(service.id ?? '').trim();
    if (!normalizedServiceId) return;
    setSelectedServiceIds(prev => {
      const next = { ...prev };
      if (next[normalizedServiceId]) delete next[normalizedServiceId];
      else next[normalizedServiceId] = { ...service, id: normalizedServiceId };
      return next;
    });
  }, [submitting]);

  const onSaveNewSkills = useCallback(async () => {
    if (selectedServiceNames.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await updateWorkerServices({ city: DEFAULT_CITY, skills: selectedServiceNames });
      setSelectedServiceIds({});
      await loadSkillSetup({ showFullScreenLoader: false });
      onSaveSuccess?.();
    } catch {
      // Keep selections; API layer already surfaces the error toast.
    } finally {
      setSubmitting(false);
    }
  }, [loadSkillSetup, onSaveSuccess, selectedServiceNames, submitting]);

  return {
    loading,
    loadError,
    submitting,
    refreshing,
    onRefresh,
    categories,
    selectedServiceIds,
    existingSkillsByKey,
    selectedServices,
    loadSkillSetup,
    onToggleService,
    onSaveNewSkills,
  };
}
