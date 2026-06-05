import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { PermissionPromptCard } from '@/components/common/PermissionPromptCard';
import { ServiceHeroCard } from '@/components/common/ServiceHeroCard';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { resolveProductLocation } from '@/modules/location-intelligence';
import type { CustomerImageUsageType, CustomerServiceListItem } from '@/types/customer';
import type { AllServicesScreenProps } from '@/types/main-screens';
import { HOME_SCREEN, ROOT_SCREEN } from '@/types/screen-names';
import { getServiceCardPriceTypeLabel, getServiceCardPricingLabel, pickServiceImage } from '@/utils/booking-catalog';
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
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const { width: screenWidth } = useWindowDimensions();
  const { locationState } = useAuthContext();
  const { beginFlow } = useBookingFlowContext();
  const {
    permissionStatus,
    requestLocationPermission,
    initializeLocation,
  } = locationState;
  const isLocationGranted = permissionStatus === 'granted';
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

  const handleLocationPermissionAction = useCallback(async () => {
    const status = await requestLocationPermission();
    if (status === 'granted') {
      await initializeLocation({ forceRefresh: true });
    }
  }, [initializeLocation, requestLocationPermission]);

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

  const onRefreshData = useCallback(async () => {
    setHasMore(true);
    await runFetch({ nextPage: 1, append: false });
  }, [runFetch]);
  const { refreshing, onRefresh } = usePullToRefresh(onRefreshData);

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
    if (!isLocationGranted) {
      setItems([]);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setHasMore(false);
      return;
    }

    if (!selectedCity) return;
    setHasMore(true);
    void runFetch({ nextPage: 1, append: false });
  }, [debouncedSearch, isLocationGranted, runFetch, selectedCity]);

  const listEmpty = !loading && !error && items.length === 0;
  const normalizedSearchText = searchText.trim();
  const normalizedDebouncedSearch = debouncedSearch.trim();
  const isSearchFetchLoading = (
    normalizedSearchText.length > 0
    && normalizedDebouncedSearch === normalizedSearchText
    && loading
    && !loadingMore
    && !refreshing
  );

  const cardGap = 12;
  const horizontalPadding = 16;
  const serviceCardWidth = Math.max(140, Math.floor((screenWidth - (horizontalPadding * 2) - cardGap) / 2));
  const listContent = !isLocationGranted ? (
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
  ) : !selectedCity ? (
    <CityAvailabilityNotice cityLabel={resolvedLocation.displayCity} />
  ) : loading && items.length === 0 ? (
    <LoadingState minHeight={520} message={APP_TEXT.main.allServices.loadingServices} />
  ) : error && items.length === 0 ? (
    <ListErrorState
      title={error}
      description={APP_TEXT.main.allServices.pullToRefreshHint}
      actionLabel={APP_TEXT.main.bookingFlow.retry}
      onAction={onRefresh}
    />
  ) : items.length > 0 ? (
    <>
      <View className="mt-2 flex-row flex-wrap justify-between">
        {items.map((item) => (
          <View key={item.id} style={{ marginBottom: 12 }}>
            <ServiceHeroCard
              title={item.name}
              subtitle={getServiceCardPricingLabel(item)}
              topRightPillLabel={getServiceCardPriceTypeLabel(item)}
              imageUrl={pickServiceImage(item)}
              width={serviceCardWidth}
              height={176}
              onPress={() => {
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
            disabled={loading || refreshing}
            onPress={() => {
              if (loadingMore || loading || refreshing) return;
              void runFetch({ nextPage: page + 1, append: true });
            }}
          />
        </View>
      ) : null}
    </>
  ) : listEmpty ? (
    <ListEmptyState
      title={APP_TEXT.main.allServices.emptyTitle}
      description={APP_TEXT.main.allServices.emptySubtitle}
      icon="search-outline"
    />
  ) : null;

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
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
              {isLocationGranted
                ? resolvedLocation.displayCity ? titleCase(resolvedLocation.displayCity) : 'Locating...'
                : APP_TEXT.main.locationAccess.noLocationLabel}
            </Text>
          </View>
        </View>

        {isLocationGranted ? (
          <View className="mt-3">
            <View>
              <AppInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder={APP_TEXT.main.allServices.searchPlaceholder}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                style={{ paddingRight: 42 }}
              />
              {normalizedSearchText.length > 0 ? (
                <View className="absolute inset-y-0 right-3 items-center justify-center">
                  {isSearchFetchLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Pressable
                      onPress={() => {
                        setSearchText('');
                        setDebouncedSearch('');
                      }}
                      className="h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95 }}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close"
                        size={16}
                        color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight}
                      />
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      {listContent}
    </GradientScreen>
  );
}
