import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { apiGet } from '@/actions/http/httpClient';
import { AnimatedSegmentTabs } from '@/components/common/AnimatedSegmentTabs';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { WorkerJobCard } from '@/components/common/WorkerJobCard';
import { JOB_STACK_SCREENS, ROOT_SCREENS } from '@/types/screen-names';
import type { WorkerJobListItem, WorkerJobListTab } from '@/types/jobs';
import { APP_TEXT } from '@/utils/appText';
import { buildWorkerJobsListPath, getErrorMessage } from '@/utils';

const LIMIT = 10;

export function JobsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<WorkerJobListTab>('ALL');
  const [items, setItems] = useState<WorkerJobListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const runFetch = useCallback(async (options: { nextPage: number; append: boolean; tab: WorkerJobListTab; refresh?: boolean }) => {
    const { nextPage, append, tab, refresh } = options;

    try {
      setError(null);
      if (append) setLoadingMore(true);
      else if (refresh) setRefreshing(true);
      else setLoading(true);

      const url = buildWorkerJobsListPath({ page: nextPage, limit: LIMIT, tab });
      const response = await apiGet<{ data?: WorkerJobListItem[] } | WorkerJobListItem[]>(url, { auth: true });
      const fetchedJobs = Array.isArray(response)
        ? response
        : (Array.isArray(response.data) ? response.data : []);

      setItems(prev => (append ? [...prev, ...fetchedJobs] : fetchedJobs));
      setPage(nextPage);
      setHasMore(fetchedJobs.length >= LIMIT);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load jobs.'));
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setHasMore(true);
    await runFetch({ nextPage: 1, append: false, tab: activeTab, refresh: true });
  }, [activeTab, runFetch]);

  const { modeKey, refreshProps } = useBrandRefreshControlProps();

  useEffect(() => {
    setHasMore(true);
    setItems([]);
    setPage(1);
    setError(null);
    void runFetch({ nextPage: 1, append: false, tab: activeTab });
  }, [activeTab, runFetch]);

  const listEmpty = !loading && !error && items.length === 0;
  const showInitialLoader = loading && !loadingMore && !refreshing;
  const listContent = showInitialLoader ? (
    <LoadingState minHeight={300} message="Loading jobs..." />
  ) : error && items.length === 0 ? (
    <ListErrorState
      title={error}
      description="Pull to refresh and try again."
      actionLabel="Retry"
      onAction={() => void onRefresh()}
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

      {hasMore ? (
        <View className="my-4">
          <LoadMoreButton
            label={loadingMore ? 'Loading more...' : 'Load more'}
            loading={loadingMore}
            disabled={loading || refreshing}
            onPress={() => {
              if (loadingMore || loading || refreshing) return;
              void runFetch({ nextPage: page + 1, append: true, tab: activeTab });
            }}
          />
        </View>
      ) : null}
    </View>
  ) : listEmpty ? (
    <ListEmptyState
      title="No jobs found"
      description="No jobs are available in this category right now."
      icon="briefcase-outline"
    />
  ) : null;

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
      refreshControl={<RefreshControl key={modeKey} refreshing={refreshing} onRefresh={() => void onRefresh()} {...refreshProps} />}
    >
      <SplitGradientTitle
        prefix={APP_TEXT.jobs.titlePrefix}
        highlight={APP_TEXT.jobs.titleHighlight}
        subtitle={APP_TEXT.jobs.subtitle}
      />

      <AnimatedSegmentTabs
        value={activeTab}
        onChange={(value) => setActiveTab(value as WorkerJobListTab)}
        items={[
          { label: APP_TEXT.jobs.tabs.all || 'All', value: 'ALL' },
          { label: APP_TEXT.jobs.tabs.newJobs || 'New Jobs', value: 'NEW_JOBS' },
          { label: APP_TEXT.jobs.tabs.ongoing || 'Ongoing', value: 'ONGOING' },
          { label: APP_TEXT.jobs.tabs.completed || 'Completed', value: 'COMPLETED' },
        ]}
      />

      <View className="mt-4">
        {listContent}
      </View>
    </GradientScreen>
  );
}
