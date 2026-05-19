import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';

import { apiGet } from '@/actions/http/httpClient';
import { AnimatedSegmentTabs } from '@/components/common/AnimatedSegmentTabs';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { CustomerBookingCard } from '@/components/common/CustomerBookingCard';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import type { Booking } from '@/types/api';
import { BOOKINGS_SCREEN, ROOT_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { buildCustomerBookingsListPath, getErrorMessage, normalizeCustomerBookingCounts } from '@/utils';
import { useAuthContext } from '@/contexts/AuthContext';

type TabType = 'ALL' | 'ONGOING' | 'COMPLETED';
const LIMIT = 10;

export function BookingsScreen() {
  const navigation = useNavigation() as any;
  const { authState } = useAuthContext();

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [items, setItems] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const runFetch = useCallback(async (options: { nextPage: number; append: boolean; tab: TabType; refresh?: boolean }) => {
    const { nextPage, append, tab, refresh } = options;

    try {
      setError(null);
      if (append) setLoadingMore(true);
      else if (refresh) setRefreshing(true);
      else setLoading(true);

      const url = buildCustomerBookingsListPath({ page: nextPage, limit: LIMIT, tab });
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
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setHasMore(true);
    await runFetch({ nextPage: 1, append: false, tab: activeTab, refresh: true });
  }, [activeTab, runFetch]);

  const refreshControlProps = useBrandRefreshControl(onRefresh);

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
    <LoadingState minHeight={300} message="Loading bookings..." />
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
        <CustomerBookingCard
          key={item.id}
          item={item}
          onPress={(id) => navigation.navigate(ROOT_SCREEN.BOOKING_DETAILS_NAVIGATOR, {
            screen: BOOKINGS_SCREEN.DETAILS,
            params: { bookingId: id },
          })}
        />
      ))}

      {hasMore ? (
        <View className="my-4">
          <LoadMoreButton
            label={loadingMore ? "Loading more..." : "Load more"}
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
      title="No bookings found"
      description="You don't have any bookings in this category yet."
      icon="calendar-outline"
    />
  ) : null;

  const bookingCounts = normalizeCustomerBookingCounts(authState.user?.bookingCounts);

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
      refreshControl={<RefreshControl {...refreshControlProps} refreshing={refreshControlProps.refreshing} />}
    >
      <Text className="text-2xl font-extrabold text-baseDark dark:text-white">
        {APP_TEXT.main.bookingsTitle}
      </Text>

      <AnimatedSegmentTabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { label: `${APP_TEXT.main.bookings.tabs.all || 'All'} (${bookingCounts.totalBookingsCount})`, value: 'ALL' },
          { label: `${APP_TEXT.main.bookings.tabs.ongoing || 'Ongoing'} (${bookingCounts.activeBookingsCount})`, value: 'ONGOING' },
          { label: `${APP_TEXT.main.bookings.tabs.completed || 'Completed'} (${bookingCounts.completedBookingsCount})`, value: 'COMPLETED' },
        ]}
      />

      <View className="mt-4">
        {listContent}
      </View>
    </GradientScreen>
  );
}
