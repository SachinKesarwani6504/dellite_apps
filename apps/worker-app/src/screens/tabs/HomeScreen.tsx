import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import { getAppBanners, getCachedWorkerHome, getWorkerHome } from '@/actions';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { CityAvailabilityNotice } from '@/components/common/CityAvailabilityNotice';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { ImageOverlayBannerCarousel } from '@/components/common/ImageOverlayBannerCarousel';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { NearbyJobCard } from '@/components/common/NearbyJobCard';
import { WorkerCurrentStatusBanner } from '@/components/common/WorkerCurrentStatusBanner';
import { LoadingState } from '@/components/common/LoadingState';
import { AppImage } from '@/components/common/AppImage';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useWorkerLiveLocation } from '@/hooks/useWorkerLiveLocation';
import { resolveProductLocation } from '@/modules/location-intelligence';
import { ApiError } from '@/types/api';
import type { WorkerHomeData } from '@/types/auth';
import { APP_BANNER_PLACEMENT_KEY, type AppBannerItem } from '@/types/app-banner';
import {
  handleBannerAction,
  formatInrCurrency,
  formatSignedPercent,
  getErrorMessage,
  resolveWorkerIdFromAuthUser,
  titleCase,
} from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

const logo = require('@/assets/images/png/dellite_logo.png');
const homePageDoodles = require('@/assets/images/png/home_page_doddles.png');

export function HomeScreen() {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const { locationState, user, me, isAuthenticated } = useAuthContext();
  const workerId = useMemo(
    () => resolveWorkerIdFromAuthUser(user, (me as Record<string, unknown> | null | undefined) ?? null),
    [me, user],
  );
  const autoGoOnlineWorkerIdRef = useRef<string | null>(null);
  const {
    isOnline: isWorkerLiveOnline,
    goOnline: goWorkerLiveOnline,
  } = useWorkerLiveLocation({ workerId });
  const {
    city,
    locality,
    state,
    formattedAddress,
    latitude,
    longitude,
    initialized,
    initializeLocation,
    loading: locationLoading,
    refreshing: locationRefreshing,
  } = locationState;
  const resolvedLocation = useMemo(() => resolveProductLocation({
    city,
    locality,
    state,
    formattedAddress,
    latitude,
    longitude,
  }), [city, formattedAddress, latitude, locality, longitude, state]);
  const selectedCity = resolvedLocation.serviceableCity ?? '';
  const cityLabel = resolvedLocation.displayCity || 'Locating...';
  const displayCityLabel = cityLabel === 'Locating...' ? cityLabel : titleCase(cityLabel);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityUnavailable, setCityUnavailable] = useState(false);
  const [homeData, setHomeData] = useState<WorkerHomeData | null>(null);
  const [homeBanners, setHomeBanners] = useState<AppBannerItem[]>([]);
  const isLocationPending = (!initialized || locationLoading || locationRefreshing) && !resolvedLocation.displayCity;
  const locationInitTriggeredRef = useRef(false);

  const loadHomeData = useCallback(async (options?: { showFullScreenLoader?: boolean }) => {
    const showFullScreenLoader = options?.showFullScreenLoader ?? true;
    if (showFullScreenLoader) setLoading(true);
    setError(null);
    setCityUnavailable(false);
    if (!selectedCity) {
      setLoading(false);
      setError(null);
      setCityUnavailable(true);
      return;
    }
    try {
      const [data, banners] = await Promise.all([
        getWorkerHome(selectedCity),
        getAppBanners({
          placementKey: APP_BANNER_PLACEMENT_KEY.WORKER_HOME,
          city: selectedCity,
        }),
      ]);
      setHomeData(data);
      setHomeBanners(Array.isArray(banners) ? banners : []);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.statusCode === 404) {
        setCityUnavailable(true);
        setError(null);
      } else {
        setError(getErrorMessage(loadError, APP_TEXT.home.loadError));
      }
      setHomeBanners([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCity]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await loadHomeData({ showFullScreenLoader: false });
  });

  useFocusEffect(
    useCallback(() => {
      if (!selectedCity) {
        setLoading(isLocationPending);
        setHomeData(null);
        setError(null);
        setCityUnavailable(!isLocationPending);
        return;
      }
      const cached = getCachedWorkerHome(selectedCity);
      if (cached) {
        setHomeData(cached);
        setLoading(false);
        void loadHomeData({ showFullScreenLoader: false });
        return;
      }
      void loadHomeData({ showFullScreenLoader: true });
    }, [isLocationPending, loadHomeData, selectedCity]),
  );

  const nearbyJobs = useMemo(
    () => (Array.isArray(homeData?.availableNearbyJobs) ? homeData.availableNearbyJobs : []),
    [homeData?.availableNearbyJobs],
  );
  const shouldShowCurrentStatusBanner = homeData?.currentStatus?.showStatusInUi === true;

  useEffect(() => {
    if (!isAuthenticated) {
      locationInitTriggeredRef.current = false;
      return;
    }

    if (locationInitTriggeredRef.current || initialized) {
      return;
    }

    locationInitTriggeredRef.current = true;
    void initializeLocation();
  }, [initializeLocation, initialized, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      autoGoOnlineWorkerIdRef.current = null;
      return;
    }

    if (!workerId || isWorkerLiveOnline) {
      return;
    }

    if (autoGoOnlineWorkerIdRef.current === workerId) {
      return;
    }

    autoGoOnlineWorkerIdRef.current = workerId;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[worker-live-location][home] auto-go-online-attempt', { workerId });
    }
    void goWorkerLiveOnline();
  }, [goWorkerLiveOnline, isAuthenticated, isWorkerLiveOnline, workerId]);

  useEffect(() => {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console.log('[worker-location-context] current', {
      workerId,
      city,
      locality,
      state,
      formattedAddress,
      latitude,
      longitude,
      selectedCity,
      resolvedLocation,
      initialized,
      locationLoading,
      locationRefreshing,
    });
  }, [
    city,
    formattedAddress,
    initialized,
    latitude,
    locality,
    locationLoading,
    locationRefreshing,
    longitude,
    resolvedLocation,
    selectedCity,
    state,
    workerId,
  ]);

  if ((loading || isLocationPending) && !homeData) {
    const loadingMessage = isLocationPending ? APP_TEXT.home.loadingLocation : APP_TEXT.home.nearbyJobsLoading;
    return (
      <GradientScreen>
        <View className="px-4 pt-6">
          <LoadingState minHeight={520} message={loadingMessage} />
        </View>
      </GradientScreen>
    );
  }

  const homeFallbackContent = !homeData ? (
    error ? (
      <ListErrorState
        title="Could not load home"
        description={error}
        onAction={() => {
          void loadHomeData({ showFullScreenLoader: true });
        }}
      />
    ) : cityUnavailable ? (
      <CityAvailabilityNotice cityLabel={resolvedLocation.displayCity} />
    ) : null
  ) : null;

  return (
    <GradientScreen
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
      floatingBackground={(
        <AppImage
          source={homePageDoodles}
          resizeMode="cover"
          className="h-full w-full"
          style={{ opacity: isDark ? 0.08 : 0.22 }}
        />
      )}
      floatingBackgroundTopInset={0}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <AppImage source={logo} resizeMode="contain" style={{ width: 104, height: 30 }} />
        <View
          className="flex-row items-center rounded-full border px-3 py-1.5"
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
          }}
        >
          <Ionicons name="location-outline" size={13} color={theme.colors.primary} />
          <Text className="ml-1 text-xs font-semibold text-primary">{displayCityLabel}</Text>
        </View>
      </View>

      {homeFallbackContent}

      {error && homeData ? (
        <View
          className="mb-3 rounded-xl border px-3 py-2"
          style={{
            borderColor: theme.colors.caution,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
          }}
        >
          <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            Showing cached data. Pull to refresh.
          </Text>
        </View>
      ) : null}

      {homeData ? (
        <>
          {shouldShowCurrentStatusBanner ? (
            <WorkerCurrentStatusBanner currentStatus={homeData.currentStatus} />
          ) : null}

          {homeBanners.length > 0 ? (
            <ImageOverlayBannerCarousel
              containerClassName={shouldShowCurrentStatusBanner ? 'mt-4' : ''}
              banners={homeBanners}
              onPressBanner={(banner) => {
                void handleBannerAction({
                  action: banner.action,
                  navigation: { navigate: navigation.navigate },
                  city: selectedCity,
                });
              }}
            />
          ) : null}

          <View className="mt-3 flex-row gap-2">
            <View
              className="flex-1 items-center rounded-ui-md border px-3 py-3"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text className="mt-2 text-2xl font-bold text-baseDark dark:text-white">{homeData.todayStats?.totalJobs ?? 0}</Text>
              <Text className="mt-1 text-[11px] text-textPrimary/70 dark:text-white/70">{APP_TEXT.home.todayJobsLabel}</Text>
            </View>
            <View
              className="flex-1 items-center rounded-ui-md border px-3 py-3"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
              }}
            >
              <Ionicons name="cash-outline" size={16} color={theme.colors.primary} />
              <Text className="mt-2 text-2xl font-bold text-baseDark dark:text-white">{formatInrCurrency(homeData.todayStats?.totalEarning)}</Text>
              <Text className="mt-1 text-[11px] text-textPrimary/70 dark:text-white/70">{APP_TEXT.home.earningsLabel}</Text>
            </View>
            <View
              className="flex-1 items-center rounded-ui-md border px-3 py-3"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
              }}
            >
              <Ionicons name="trending-up-outline" size={16} color={theme.colors.primary} />
              <Text className="mt-2 text-2xl font-bold text-baseDark dark:text-white">{formatSignedPercent(homeData.todayStats?.growth)}</Text>
              <Text className="mt-1 text-[11px] text-textPrimary/70 dark:text-white/70">{APP_TEXT.home.growthLabel}</Text>
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-bold text-baseDark dark:text-white">{APP_TEXT.home.nearbyJobsTitle}</Text>
            {nearbyJobs.length === 0 ? (
              <ListEmptyState
                containerClassName="mt-3"
                icon="briefcase-outline"
                title={APP_TEXT.home.nearbyJobsEmpty}
                description="New jobs will appear here when available."
              />
            ) : (
              <View className="mt-2 gap-3">
                {nearbyJobs.map((job, index) => {
                  const id = job.id ?? `${job.title ?? APP_TEXT.home.jobFallback}-${index}`;
                  const title = job.title ?? APP_TEXT.home.jobFallback;
                  return (
                    <NearbyJobCard
                      key={id}
                      title={title}
                      city={job.city}
                      distanceKm={job.distanceKm}
                      payoutLabel={formatInrCurrency(job.payout)}
                      imageUrl={job.imageUrl}
                      isDark={isDark}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {homeData.footer ? (
            <View className="mt-6">
              {(homeData.footer.madeWith || homeData.footer.from) ? (
                <View className="flex-row items-center">
                  {homeData.footer.madeWith ? (
                    <Text className="text-[26px] font-extrabold text-baseDark dark:text-white">{homeData.footer.madeWith}</Text>
                  ) : null}
                  <Ionicons name="heart" size={18} color={theme.colors.negative} style={{ marginHorizontal: 6, marginTop: 2 }} />
                  {homeData.footer.from ? (
                    <Text className="text-[26px] font-extrabold text-baseDark dark:text-white">{homeData.footer.from}</Text>
                  ) : null}
                </View>
              ) : null}
              {homeData.footer.region ? (
                <GradientWord word={homeData.footer.region} className="mt-1 text-[36px] font-extrabold" />
              ) : null}
              {homeData.footer.copyright ? (
                <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                  {homeData.footer.copyright}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </GradientScreen>
  );
}
