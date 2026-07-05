import { useCallback, useEffect, useState } from 'react';
import { getWorkerSettlementDetail } from '@/actions/workerFinanceActions';
import type { SettlementDetailResponse } from '@/types/worker-finance';
import { getErrorMessage } from '@/utils';

export function useWorkerSettlementDetailController(settlementId: string) {
  const [detail, setDetail] = useState<SettlementDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadDetail = useCallback(async (options?: { refresh?: boolean; silent?: boolean }) => {
    const isRefresh = options?.refresh ?? false;
    const isSilent = options?.silent ?? false;

    if (!isSilent) {
      if (isRefresh) {
        setDetailRefreshing(true);
      } else {
        setDetailLoading(true);
      }
    }
    setDetailError(null);

    try {
      const response = await getWorkerSettlementDetail(settlementId);
      setDetail(response);
    } catch (loadError) {
      setDetailError(getErrorMessage(loadError, 'Unable to load settlement detail right now.'));
    } finally {
      setDetailLoading(false);
      setDetailRefreshing(false);
    }
  }, [settlementId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const refresh = useCallback(async () => {
    await loadDetail({ refresh: true });
  }, [loadDetail]);

  return {
    detail,
    detailLoading,
    detailRefreshing,
    detailError,
    refresh,
  };
}
