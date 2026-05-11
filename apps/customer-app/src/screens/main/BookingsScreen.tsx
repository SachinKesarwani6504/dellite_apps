import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';

import { apiGet } from '@/actions/http/httpClient';
import { AnimatedSegmentTabs } from '@/components/common/AnimatedSegmentTabs';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { CustomerBookingCard } from '@/components/common/CustomerBookingCard';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import type { Booking } from '@/types/api';
import { BOOKINGS_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { getErrorMessage } from '@/utils';

type TabType = 'ALL' | 'ONGOING' | 'COMPLETED';
const LIMIT = 10;

export function BookingsScreen() {
  const navigation = useNavigation() as any;

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [items, setItems] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const runFetch = useCallback(async (options: { nextPage: number; append: boolean; tab: TabType }) => {
    const { nextPage, append, tab } = options;

    try {
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);

      let statusQuery = '';
      if (tab === 'ONGOING') {
        statusQuery = '&includeBookingStatus=IN_PROGRESS';
      } else if (tab === 'COMPLETED') {
        statusQuery = '&includeBookingStatus=COMPLETED';
      }

      const url = `/bookings?role=CUSTOMER&page=${nextPage}&limit=${LIMIT}${statusQuery}`;
      const response = await apiGet<{ data: Booking[] }>(url, { auth: true });
      const fetchedBookings = response.data || [];

      setItems(prev => (append ? [...prev, ...fetchedBookings] : fetchedBookings));
      setPage(nextPage);
      setHasMore(fetchedBookings.length >= LIMIT);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load bookings.'));
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setHasMore(true);
    await runFetch({ nextPage: 1, append: false, tab: activeTab });
  }, [activeTab, runFetch]);

  const refreshControlProps = useBrandRefreshControl(onRefresh);

  useEffect(() => {
    setHasMore(true);
    void runFetch({ nextPage: 1, append: false, tab: activeTab });
  }, [activeTab, runFetch]);

  const listEmpty = !loading && !error && items.length === 0;

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
      refreshControl={<RefreshControl {...refreshControlProps} />}
    >
      <SplitGradientTitle
        prefix={APP_TEXT.main.bookings.titlePrefix}
        highlight={APP_TEXT.main.bookings.titleHighlight}
        subtitle={APP_TEXT.main.bookings.subtitle}
        inline
        prefixClassName="text-[34px] font-extrabold leading-[38px] text-baseDark dark:text-white"
        highlightClassName="text-[38px] font-extrabold leading-[41px]"
      />

      <AnimatedSegmentTabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { label: APP_TEXT.main.bookings.tabs.all || 'All', value: 'ALL' },
          { label: APP_TEXT.main.bookings.tabs.ongoing || 'Ongoing', value: 'ONGOING' },
          { label: APP_TEXT.main.bookings.tabs.completed || 'Completed', value: 'COMPLETED' },
        ]}
      />

      <View className="mt-4">
        {loading && items.length === 0 ? (
          <LoadingState minHeight={300} message="Loading bookings..." />
        ) : null}

        {error && items.length === 0 ? (
          <ListErrorState
            title={error}
            description="Pull to refresh and try again."
            actionLabel="Retry"
            onAction={() => void onRefresh()}
          />
        ) : null}

        {!loading && items.length > 0 ? (
          <View>
            {items.map(item => (
              <CustomerBookingCard
                key={item.id}
                item={item}
                onPress={(id) => navigation.navigate(BOOKINGS_SCREEN.DETAILS, { bookingId: id })}
              />
            ))}

            {hasMore ? (
              <View className="my-4">
                <LoadMoreButton
                  label={loadingMore ? "Loading more..." : "Load more"}
                  loading={loadingMore}
                  disabled={loading}
                  onPress={() => {
                    if (loadingMore || loading) return;
                    void runFetch({ nextPage: page + 1, append: true, tab: activeTab });
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {listEmpty ? (
          <ListEmptyState
            title="No bookings found"
            description="You don't have any bookings in this category yet."
            icon="calendar-outline"
          />
        ) : null}
      </View>
    </GradientScreen>
  );
}
