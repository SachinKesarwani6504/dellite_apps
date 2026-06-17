import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import { apiGet } from '@/actions/http/httpClient';
import { getWorkerJobsSummary } from '@/actions';
import { AnimatedSegmentTabs } from '@/components/common/AnimatedSegmentTabs';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PermissionPromptCard } from '@/components/common/PermissionPromptCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { WorkerJobCard } from '@/components/common/WorkerJobCard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { JOB_STACK_SCREENS, ROOT_SCREENS } from '@/types/screen-names';
import type { WorkerJobListItem, WorkerJobListTab, WorkerJobsListMode, WorkerJobsSummary } from '@/types/jobs';
import { APP_TEXT } from '@/utils/appText';
import { buildWorkerJobsListPath, getErrorMessage, normalizeWorkerJobListTabForUi } from '@/utils';
import { uiColors } from '@/utils/theme';

const LIMIT = 10;
const DEFAULT_JOBS_SUMMARY: WorkerJobsSummary = {
  allJobs: 0,
  newJobs: 0,
  ongoingJobs: 0,
  completedJobs: 0,
};

export function JobsScreen() {
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { locationState } = useAuthContext();
  const { permissionStatus, initializeLocation, requestLocationPermission } = locationState;
  const requestedListMode = route?.params?.listMode as WorkerJobsListMode | undefined;
  const listMode = requestedListMode === 'NEW_JOBS' ? 'NEW_JOBS' : 'ALL';
  const isFixedListMode = listMode !== 'ALL';
  const fixedListTab: WorkerJobListTab = 'NEW_JOBS';
  const requestedInitialTab = normalizeWorkerJobListTabForUi(route?.params?.initialTab as WorkerJobListTab | undefined);
  const requestedInitialTabKey = route?.params?.initialTabRequestKey as number | undefined;
  const [activeTab, setActiveTab] = useState<WorkerJobListTab>(
    listMode === 'ALL' ? requestedInitialTab : fixedListTab,
  );
  const activeListTab = isFixedListMode ? fixedListTab : activeTab;
  const [items, setItems] = useState<WorkerJobListItem[]>([]);
  const [summary, setSummary] = useState<WorkerJobsSummary>(DEFAULT_JOBS_SUMMARY);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const initialLoadIdRef = useRef(0);
  const loadMoreIdRef = useRef(0);

  const runFetch = useCallback(async (options: { nextPage: number; append: boolean; tab: WorkerJobListTab }) => {
    const { nextPage, append, tab } = options;
    let requestId = 0;

    try {
      setError(null);
      if (append) {
        requestId = loadMoreIdRef.current + 1;
        loadMoreIdRef.current = requestId;
        setLoadingMore(true);
      } else {
        requestId = initialLoadIdRef.current + 1;
        initialLoadIdRef.current = requestId;
        setLoading(true);
      }

      const fetchJobs = async (disablePaymentStatusFilter = false) => {
        const url = buildWorkerJobsListPath(
          { page: nextPage, limit: LIMIT, tab },
          { disablePaymentStatusFilter },
        );
        const response = await apiGet<{ data?: WorkerJobListItem[]; items?: WorkerJobListItem[] } | WorkerJobListItem[]>(url, { auth: true });
        return Array.isArray(response)
          ? response
          : (Array.isArray(response.data) ? response.data : (Array.isArray(response.items) ? response.items : []));
      };

      let fetchedJobs = await fetchJobs();
      if (tab === 'ONGOING' && !append && fetchedJobs.length === 0) {
        fetchedJobs = await fetchJobs(true);
      }

      setItems(prev => (append ? [...prev, ...fetchedJobs] : fetchedJobs));
      setPage(nextPage);
      setHasMore(fetchedJobs.length >= LIMIT);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load jobs.'));
      setHasMore(false);
    } finally {
      if (append) {
        if (requestId === loadMoreIdRef.current) {
          setLoadingMore(false);
        }
      } else if (requestId === initialLoadIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      setSummary(await getWorkerJobsSummary());
    } catch {
      setSummary(DEFAULT_JOBS_SUMMARY);
    }
  }, []);

  const onRefreshData = useCallback(async () => {
    setHasMore(true);
    if (isFixedListMode) {
      await runFetch({ nextPage: 1, append: false, tab: activeListTab });
      return;
    }
    await Promise.all([
      refreshSummary(),
      runFetch({ nextPage: 1, append: false, tab: activeListTab }),
    ]);
  }, [activeListTab, isFixedListMode, refreshSummary, runFetch]);

  const { refreshing, onRefresh } = usePullToRefresh(onRefreshData);

  useEffect(() => {
    if (isFixedListMode || !requestedInitialTab) return;
    setActiveTab(requestedInitialTab);
  }, [isFixedListMode, requestedInitialTab, requestedInitialTabKey]);


  useEffect(() => {
    setHasMore(true);
    setItems([]);
    setPage(1);
    setError(null);
    void runFetch({ nextPage: 1, append: false, tab: activeListTab });
  }, [activeListTab, runFetch]);

  useFocusEffect(useCallback(() => {
    if (isFixedListMode) {
      setSummary(DEFAULT_JOBS_SUMMARY);
      return;
    }
    void refreshSummary();
  }, [isFixedListMode, refreshSummary]));

  const handleLocationPermissionAction = useCallback(async () => {
    const status = await requestLocationPermission();
    if (status === 'granted') {
      await initializeLocation({ forceRefresh: true });
    }
  }, [initializeLocation, requestLocationPermission]);

  const shouldShowLocationPrompt = permissionStatus !== 'granted';

  const listEmpty = !loading && !error && items.length === 0;
  const showInitialLoader = loading && !loadingMore && !refreshing;
  const listContent = showInitialLoader ? (
    <LoadingState minHeight={300} message="Loading jobs..." />
  ) : error && items.length === 0 ? (
    <ListErrorState
      title={error}
      description="Pull to refresh and try again."
      actionLabel="Retry"
      onAction={onRefresh}
    />
  ) : items.length > 0 ? (
    <View>
      {items.map(item => (
        <WorkerJobCard
          key={item.booking.id}
          item={item}
          onPress={(jobId) => navigation.navigate(ROOT_SCREENS.jobDetailsNavigator, {
            screen: JOB_STACK_SCREENS.details,
            params: { jobId, inviteStatus: item.invite?.inviteStatus ?? null },
          })}
        />
      ))}

      {hasMore && !refreshing ? (
        <View className="my-4">
          <LoadMoreButton
            label={loadingMore ? 'Loading more...' : 'Load more'}
            loading={loadingMore}
            disabled={loading || refreshing}
            onPress={() => {
              if (loadingMore || loading || refreshing) return;
              void runFetch({ nextPage: page + 1, append: true, tab: activeListTab });
            }}
          />
        </View>
      ) : null}
    </View>
  ) : listEmpty ? (
    <ListEmptyState
      title={listMode === 'NEW_JOBS' ? APP_TEXT.jobs.availableJobsEmptyTitle : APP_TEXT.jobs.emptyTitle}
      description={listMode === 'NEW_JOBS' ? APP_TEXT.jobs.availableJobsEmptyDescription : APP_TEXT.jobs.emptyDescription}
      icon="briefcase-outline"
    />
  ) : null;

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
    >
      <Text className="text-2xl font-extrabold text-baseDark dark:text-white">
        {listMode === 'NEW_JOBS'
          ? APP_TEXT.jobs.availableJobsTitle
          : `${APP_TEXT.jobs.titlePrefix} ${APP_TEXT.jobs.titleHighlight}`}
      </Text>
      <Text className="mt-1 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
        {listMode === 'NEW_JOBS'
          ? APP_TEXT.jobs.availableJobsSubtitle
          : APP_TEXT.jobs.subtitle}
      </Text>

      {shouldShowLocationPrompt ? (
        <View className="mt-4">
          <PermissionPromptCard
            tone="location"
            title={APP_TEXT.home.locationAccess.title}
            subtitle={APP_TEXT.home.locationAccess.subtitle}
            actionLabel={APP_TEXT.home.locationAccess.actionLabel}
            onAction={() => {
              void handleLocationPermissionAction();
            }}
            helperText={APP_TEXT.home.locationAccess.helpText}
          />
        </View>
      ) : null}

      {!isFixedListMode ? (
        <AnimatedSegmentTabs
          value={activeTab}
          onChange={(value) => setActiveTab(normalizeWorkerJobListTabForUi(value as WorkerJobListTab))}
          items={[
            { label: APP_TEXT.jobs.tabs.all || 'All', count: summary.allJobs, value: 'ALL' },
            { label: APP_TEXT.jobs.tabs.newJobs || 'New Jobs', count: summary.newJobs, value: 'NEW_JOBS' },
            { label: APP_TEXT.jobs.tabs.completed || 'Completed', count: summary.completedJobs, value: 'COMPLETED' },
          ]}
        />
      ) : null}

      <View className="mt-4">
        {listContent}
      </View>
    </GradientScreen>
  );
}
