import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { customerActions } from '@/actions';
import { AppInput } from '@/components/common/AppInput';
import { CityAvailabilityNotice } from '@/components/common/CityAvailabilityNotice';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { LoadingState } from '@/components/common/LoadingState';
import { ServiceHeroCard } from '@/components/common/ServiceHeroCard';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import type { CustomerImageUsageType, CustomerServiceListItem } from '@/types/customer';
import type { AllServicesScreenProps } from '@/types/main-screens';
import { HOME_SCREEN, ROOT_SCREEN } from '@/types/screen-names';
import { pickServiceImage } from '@/utils/booking-catalog';
import { createBookingFlowService, getErrorMessage } from '@/utils';
import { safeImageUrl, titleCase } from '@/utils/home';
import { palette, theme, uiColors } from '@/utils/theme';
import { APP_TEXT } from '@/utils/appText';

const PAGINATION_ENABLED = true;
const DEFAULT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;
const CATALOG_USAGE_TYPES: CustomerImageUsageType[] = ['MAIN', 'ICON'];

export function AllServicesScreen({ navigation }: AllServicesScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const { locationState } = useAuthContext();
  const { beginFlow } = useBookingFlowContext();
  const resolvedLocation = useMemo(() => resolveProductLocation({
    city: locationState.city,
    locality: locationState.locality,
    state: locationState.state,
    formattedAddress: locationState.formattedAddress,
    latitude: locationState.latitude,
    longitude: locationState.longitude,
  }), [
    locationState.city,
    locationState.formattedAddress,
    locationState.latitude,
    locationState.locality,
    locationState.longitude,
    locationState.state,
  ]);

  const selectedCity = resolvedLocation.serviceableCity ?? '';
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [items, setItems] = useState<CustomerServiceListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const runFetch = useCallback(async (options: { nextPage: number; append: boolean }) => {
    if (!selectedCity) return;
    const { nextPage, append } = options;

    const isPaginated = PAGINATION_ENABLED;
    const query = {
      city: selectedCity,
      search: debouncedSearch.trim().length > 0 ? debouncedSearch.trim() : undefined,
      page: isPaginated ? nextPage : undefined,
      limit: isPaginated ? DEFAULT_LIMIT : undefined,
      includeCategory: true,
      includeSubcategory: true,
      includePriceOptions: true,
      includeTask: true,
      includeImage: true,
      usageType: CATALOG_USAGE_TYPES,
    };

    try {
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);

      const data = await customerActions.getCustomerServices(query);
      setItems(prev => (append ? [...prev, ...data] : data));
      setPage(nextPage);

      if (!isPaginated) {
        setHasMore(false);
      } else {
        // If backend returns fewer than limit, we reached the end.
        setHasMore(data.length >= DEFAULT_LIMIT);
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, APP_TEXT.main.bookingFlow.loadingError));
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, selectedCity]);

  const onRefresh = useCallback(async () => {
    setHasMore(true);
    await runFetch({ nextPage: 1, append: false });
  }, [runFetch]);
  const refreshControlProps = useBrandRefreshControl(onRefresh);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  useEffect(() => {
    if (!selectedCity) return;
    setHasMore(true);
    void runFetch({ nextPage: 1, append: false });
  }, [debouncedSearch, runFetch, selectedCity]);

  const listEmpty = !loading && !error && items.length === 0;

  const cardGap = 12;
  const horizontalPadding = 16;
  const serviceCardWidth = Math.max(140, Math.floor((screenWidth - (horizontalPadding * 2) - cardGap) / 2));

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}
      refreshControl={<RefreshControl {...refreshControlProps} />}
    >
      <View className="mb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-extrabold text-baseDark dark:text-white">
            {APP_TEXT.main.allServicesTitle}
          </Text>
          <View
            className="flex-row items-center rounded-full border px-3 py-1.5"
            style={{
              borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="location-outline" size={13} color={theme.colors.primary} />
            <Text className="ml-1 text-xs font-semibold text-primary">
              {resolvedLocation.displayCity ? titleCase(resolvedLocation.displayCity) : 'Locating...'}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <AppInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={APP_TEXT.main.allServices.searchPlaceholder}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
      </View>

      {!selectedCity ? (
        <CityAvailabilityNotice cityLabel={resolvedLocation.displayCity} />
      ) : null}

      {loading && items.length === 0 ? (
        <LoadingState minHeight={520} message={APP_TEXT.main.allServices.loadingServices} />
      ) : null}

      {error && items.length === 0 ? (
        <ListErrorState
          title={error}
          description={APP_TEXT.main.allServices.pullToRefreshHint}
          actionLabel={APP_TEXT.main.bookingFlow.retry}
          onAction={() => void onRefresh()}
        />
      ) : null}

      {selectedCity && !loading && items.length > 0 ? (
        <>
          <View className="mt-2 flex-row flex-wrap justify-between">
            {items.map((item) => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                <ServiceHeroCard
                  title={item.name}
                  imageUrl={pickServiceImage(item)}
                  width={serviceCardWidth}
                  height={176}
                  onPress={() => {
                    // Jump into booking flow via the service selection screen.
                    beginFlow({
                      sourceType: 'popular_service',
                      categoryId: item.category?.id,
                      service: createBookingFlowService(item),
                    });
                    navigation.navigate(ROOT_SCREEN.BOOKING_FLOW_NAVIGATOR, {
                      screen: HOME_SCREEN.SUBCATEGORY_SERVICES,
                      params: {
                        sourceType: 'popular_service',
                        categoryId: item.category?.id,
                        subcategoryId: item.subCategory?.id,
                        serviceId: item.id,
                        city: selectedCity,
                      },
                    });
                  }}
                />
              </View>
            ))}
          </View>

          {PAGINATION_ENABLED && hasMore ? (
            <View className="mt-3">
              <LoadMoreButton
                label={loadingMore ? APP_TEXT.main.allServices.loadingMore : APP_TEXT.main.allServices.loadMoreCta}
                loading={loadingMore}
                disabled={loading}
                onPress={() => {
                  if (loadingMore || loading) return;
                  void runFetch({ nextPage: page + 1, append: true });
                }}
              />
            </View>
          ) : null}
        </>
      ) : null}

      {listEmpty ? (
        <ListEmptyState
          title={APP_TEXT.main.allServices.emptyTitle}
          description={APP_TEXT.main.allServices.emptySubtitle}
          icon="search-outline"
        />
      ) : null}
    </GradientScreen>
  );
}
