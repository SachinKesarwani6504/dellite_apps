import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';

import { apiGet } from '@/actions/http/httpClient';
import { getCustomerBookingsSummary } from '@/actions/customerActions';
import { AnimatedSegmentTabs } from '@/components/common/AnimatedSegmentTabs';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { CustomerBookingCard } from '@/components/common/CustomerBookingCard';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PermissionPromptCard } from '@/components/common/PermissionPromptCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { Booking, CustomerBookingListTab, CustomerBookingsSummary } from '@/types/api';
import { BOOKINGS_SCREEN, ROOT_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { buildCustomerBookingsListPath, getErrorMessage } from '@/utils';

const LIMIT = 10;
const DEFAULT_BOOKINGS_SUMMARY: CustomerBookingsSummary = {
  allBookings: 0,
  ongoingBookings: 0,
  completedBookings: 0,
};

export function BookingsScreen() {
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const navigation = useNavigation() as any;
  const { locationState } = useAuthContext();
  const {
    permissionStatus,
    requestLocationPermission,
    initializeLocation,
  } = locationState;
  const isLocationGranted = permissionStatus === 'granted';

  const [activeTab, setActiveTab] = useState<CustomerBookingListTab>('ALL');
  const [items, setItems] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<CustomerBookingsSummary>(DEFAULT_BOOKINGS_SUMMARY);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const initialLoadIdRef = useRef(0);
  const loadMoreIdRef = useRef(0);

  const handleLocationPermissionAction = useCallback(async () => {
    const status = await requestLocationPermission();
    if (status === 'granted') {
      await initializeLocation({ forceRefresh: true });
    }
  }, [initializeLocation, requestLocationPermission]);

  const runFetch = useCallback(async (options: { nextPage: number; append: boolean; tab: CustomerBookingListTab }) => {
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
      setSummary(await getCustomerBookingsSummary());
    } catch {
      setSummary(DEFAULT_BOOKINGS_SUMMARY);
    }
  }, []);

  const onRefreshData = useCallback(async () => {
    if (!isLocationGranted) return;
    setHasMore(true);
    await Promise.all([
      refreshSummary(),
      runFetch({ nextPage: 1, append: false, tab: activeTab }),
    ]);
  }, [activeTab, isLocationGranted, refreshSummary, runFetch]);

  const { refreshing, onRefresh } = usePullToRefresh(onRefreshData);

  useEffect(() => {
    if (!isLocationGranted) {
      setHasMore(false);
      setItems([]);
      setPage(1);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    setHasMore(true);
    setItems([]);
    setPage(1);
    setError(null);
    void runFetch({ nextPage: 1, append: false, tab: activeTab });
  }, [activeTab, isLocationGranted, runFetch]);

  useFocusEffect(useCallback(() => {
    if (!isLocationGranted) {
      setSummary(DEFAULT_BOOKINGS_SUMMARY);
      return;
    }
    void refreshSummary();
  }, [isLocationGranted, refreshSummary]));

  const listEmpty = !loading && !error && items.length === 0;
  const showInitialLoader = loading && !loadingMore && !refreshing;
  const listContent = showInitialLoader ? (
    <LoadingState minHeight={300} message="Loading bookings..." />
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
        <CustomerBookingCard
          key={item.id}
          item={item}
          onPress={(id) => navigation.navigate(ROOT_SCREEN.BOOKING_DETAILS_NAVIGATOR, {
            screen: BOOKINGS_SCREEN.DETAILS,
            params: { bookingId: id },
          })}
        />
      ))}

      {hasMore && !refreshing ? (
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
      title={activeTab === 'COMPLETED' ? APP_TEXT.main.bookings.completedEmptyTitle : APP_TEXT.main.bookings.emptyTitle}
      description={activeTab === 'COMPLETED' ? APP_TEXT.main.bookings.completedEmptyDescription : APP_TEXT.main.bookings.emptyDescription}
      icon="calendar-outline"
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
        {APP_TEXT.main.bookings.allTitle}
      </Text>

      {!isLocationGranted ? (
        <View className="mt-3">
          <PermissionPromptCard
            tone="location"
            title={APP_TEXT.main.locationAccess.title}
            subtitle={APP_TEXT.main.locationAccess.subtitle}
            actionLabel={APP_TEXT.main.locationAccess.actionLabel}
            onAction={() => {
              void handleLocationPermissionAction();
            }}
            helperText={APP_TEXT.main.locationAccess.helpText}
          />
        </View>
      ) : null}

      {isLocationGranted ? (
        <>
          <AnimatedSegmentTabs
            value={activeTab}
            onChange={(value) => setActiveTab(value as CustomerBookingListTab)}
            items={[
              { label: APP_TEXT.main.bookings.tabs.all || 'All', count: summary.allBookings, value: 'ALL' },
              { label: APP_TEXT.main.bookings.tabs.completed || 'Completed', count: summary.completedBookings, value: 'COMPLETED' },
            ]}
          />

          <View className="mt-4">
            {listContent}
          </View>
        </>
      ) : null}
    </GradientScreen>
  );
}
