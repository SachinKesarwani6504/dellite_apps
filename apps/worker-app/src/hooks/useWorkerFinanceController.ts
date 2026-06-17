import { useCallback, useEffect, useState } from 'react';
import {
  getWorkerEarningsSettlements,
  getWorkerEarningsSummary,
} from '@/actions/workerFinanceActions';
import type {
  SettlementCard,
  WorkerEarningsPeriodFilterValue,
  WorkerEarningsSettlementsResponse,
  WorkerEarningsSummaryResponse,
  WorkerEarningsTabValue,
  WorkerFinanceLoadArgs,
  WorkerFinancePagination,
} from '@/types/worker-finance';
import { getErrorMessage } from '@/utils';

const SETTLEMENTS_PAGE_LIMIT = 20;

export function useWorkerFinanceController() {
  const [activeTab, setActiveTab] = useState<WorkerEarningsTabValue>('SUMMARY');
  const [summaryData, setSummaryData] = useState<WorkerEarningsSummaryResponse | null>(null);
  const [settlementsData, setSettlementsData] = useState<WorkerEarningsSettlementsResponse | null>(null);
  const [settlementItems, setSettlementItems] = useState<SettlementCard[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<WorkerEarningsPeriodFilterValue>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [pagination, setPagination] = useState<WorkerFinancePagination | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [settlementsRefreshing, setSettlementsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [settlementsError, setSettlementsError] = useState<string | null>(null);

  const loadSummary = useCallback(async (options?: { refresh?: boolean; silent?: boolean }) => {
    const isRefresh = options?.refresh ?? false;
    const isSilent = options?.silent ?? false;

    if (!isSilent) {
      if (isRefresh) {
        setSummaryRefreshing(true);
      } else {
        setSummaryLoading(true);
      }
    }
    setSummaryError(null);

    try {
      const response = await getWorkerEarningsSummary({
        includeGrowthRate: true,
      });
      setSummaryData(response);
    } catch (loadError) {
      setSummaryError(getErrorMessage(loadError, 'Unable to load earnings summary right now.'));
    } finally {
      setSummaryLoading(false);
      setSummaryRefreshing(false);
    }
  }, []);

  const loadSettlements = useCallback(async ({
    isRefresh = false,
    page = 1,
    append = false,
    silent = false,
    period = selectedPeriod,
    startDate = customStartDate,
    endDate = customEndDate,
  }: WorkerFinanceLoadArgs & {
    period?: WorkerEarningsPeriodFilterValue;
    startDate?: string | null;
    endDate?: string | null;
    silent?: boolean;
  } = {}) => {
    if (period === 'CUSTOM' && (!startDate || !endDate)) {
      setSettlementsLoading(false);
      setSettlementsRefreshing(false);
      setLoadingMore(false);
      return;
    }

    if (!silent) {
      if (isRefresh) {
        setSettlementsRefreshing(true);
      } else if (append) {
        setLoadingMore(true);
      } else {
        setSettlementsLoading(true);
      }
    }
    setSettlementsError(null);

    try {
      const response = await getWorkerEarningsSettlements({
        page,
        limit: SETTLEMENTS_PAGE_LIMIT,
        period,
        startDate: period === 'CUSTOM' ? startDate ?? undefined : undefined,
        endDate: period === 'CUSTOM' ? endDate ?? undefined : undefined,
      });

      setSettlementsData(response);
      setPagination(response.pagination ?? null);
      setSettlementItems(currentItems => (
        append ? [...currentItems, ...(response.dailySettlements ?? [])] : (response.dailySettlements ?? [])
      ));
    } catch (loadError) {
      setSettlementsError(getErrorMessage(loadError, 'Unable to load settlements right now.'));
    } finally {
      setSettlementsLoading(false);
      setSettlementsRefreshing(false);
      setLoadingMore(false);
    }
  }, [customEndDate, customStartDate, selectedPeriod]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (activeTab !== 'SETTLEMENTS') return;
    void loadSettlements();
  }, [activeTab, customEndDate, customStartDate, loadSettlements, selectedPeriod]);

  const changeTab = useCallback((tab: WorkerEarningsTabValue) => {
    setActiveTab(tab);
  }, []);

  const refresh = useCallback(async () => {
    if (activeTab === 'SUMMARY') {
      await loadSummary({ refresh: true });
      return;
    }
    await loadSettlements({ isRefresh: true, page: 1 });
  }, [activeTab, loadSettlements, loadSummary]);

  const reloadSilently = useCallback(async () => {
    if (activeTab === 'SUMMARY') {
      await loadSummary({ silent: true });
      return;
    }
    await loadSettlements({ silent: true, page: 1 });
  }, [activeTab, loadSettlements, loadSummary]);

  const loadMore = useCallback(async () => {
    if (activeTab !== 'SETTLEMENTS' || settlementsLoading || settlementsRefreshing || loadingMore || !pagination?.hasNextPage) {
      return;
    }
    await loadSettlements({
      page: (pagination.page ?? 1) + 1,
      append: true,
    });
  }, [activeTab, loadSettlements, loadingMore, pagination?.hasNextPage, pagination?.page, settlementsLoading, settlementsRefreshing]);

  const applyPeriodFilter = useCallback((
    period: WorkerEarningsPeriodFilterValue,
    startDate?: string,
    endDate?: string,
  ) => {
    setSelectedPeriod(period);
    if (period === 'CUSTOM') {
      setCustomStartDate(startDate ?? null);
      setCustomEndDate(endDate ?? null);
    }
  }, []);

  return {
    activeTab,
    summaryData,
    settlementsData,
    settlementItems,
    selectedPeriod,
    customStartDate,
    customEndDate,
    pagination,
    hasMore: Boolean(pagination?.hasNextPage),
    summaryLoading,
    settlementsLoading,
    summaryRefreshing,
    settlementsRefreshing,
    loadingMore,
    summaryError,
    settlementsError,
    changeTab,
    applyPeriodFilter,
    reloadSilently,
    refresh,
    loadMore,
    reloadSettlements: loadSettlements,
  };
}
