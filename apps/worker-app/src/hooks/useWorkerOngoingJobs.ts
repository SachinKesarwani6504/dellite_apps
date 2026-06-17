import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { apiGet } from '@/actions/http/httpClient';
import type { WorkerJobListItem } from '@/types/jobs';
import { buildWorkerJobsListPath } from '@/utils/worker-jobs';

const ONGOING_JOBS_LIMIT = 12;

export function useWorkerOngoingJobs(enabled = true) {
  const [items, setItems] = useState<WorkerJobListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    try {
      const url = buildWorkerJobsListPath({
        page: 1,
        limit: ONGOING_JOBS_LIMIT,
        tab: 'ONGOING',
      });
      const response = await apiGet<{ data?: WorkerJobListItem[]; items?: WorkerJobListItem[] } | WorkerJobListItem[]>(url, { auth: true });
      const fetchedJobs = Array.isArray(response)
        ? response
        : (Array.isArray(response.data) ? response.data : (Array.isArray(response.items) ? response.items : []));

      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(fetchedJobs);
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    items,
    loading,
    refresh,
    hasOngoingJobs: items.length > 0,
  };
}
