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
import { ListErrorState } from '@/components/common/ListErrorState';
import { PermissionPromptCard } from '@/components/common/PermissionPromptCard';
import { WorkerNearbyGoldenJobCard } from '@/components/common/WorkerNearbyGoldenJobCard';
import { WorkerCurrentStatusBanner } from '@/components/common/WorkerCurrentStatusBanner';
import { LoadingState } from '@/components/common/LoadingState';
import { AppImage } from '@/components/common/AppImage';
import { SectionHeaderRow } from '@/components/common/SectionHeaderRow';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useWorkerLiveLocation } from '@/hooks/useWorkerLiveLocation';
import { resolveProductLocation } from '@/modules/location-intelligence';
import { ApiError } from '@/types/api';
import type { WorkerHomeData } from '@/types/auth';
import { APP_BANNER_PLACEMENT_KEY, type AppBannerItem } from '@/types/app-banner';
import { JOB_STACK_SCREENS, MAIN_TAB_SCREENS, ROOT_SCREENS } from '@/types/screen-names';
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

// Keep customer/worker home spacing aligned for visual consistency.
const HOME_SCREEN_SPACING = {
  contentHorizontal: 16,
  contentTop: 16,
  contentBottom: 28,
  headerBottom: 16,
  bannerTopClassName: 'mt-4',
} as const;

export function HomeScreen() {
  const navigation = useNavigation<any>();
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
    permissionStatus,
    initialized,
    loading: locationLoading,
    refreshing: locationRefreshing,
    requestLocationPermission,
    initializeLocation,
  } = locationState;
  const isLocationPermissionPending = permissionStatus === 'undetermined';
  const isLocationGranted = permissionStatus === 'granted';
  const resolvedLocation = useMemo(() => resolveProductLocation({
    city,
    locality,
    state,
    formattedAddress,
    latitude,
    longitude,
  }), [city, formattedAddress, latitude, locality, longitude, state]);
  const selectedCity = resolvedLocation.serviceableCity ?? '';
  const cityLabel = isLocationPermissionPending || isLocationGranted
    ? resolvedLocation.displayCity || 'Locating...'
    : APP_TEXT.home.locationAccess.noLocationLabel;
  const displayCityLabel = cityLabel === 'Locating...'
    || cityLabel === APP_TEXT.home.locationAccess.noLocationLabel
    ? cityLabel
    : titleCase(cityLabel);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityUnavailable, setCityUnavailable] = useState(false);
  const [homeData, setHomeData] = useState<WorkerHomeData | null>(null);
  const [homeBanners, setHomeBanners] = useState<AppBannerItem[]>([]);
  const isLocationPending =
    isLocationPermissionPending
    || (isLocationGranted && (!initialized || locationLoading || locationRefreshing) && !resolvedLocation.displayCity);

  const handleLocationPermissionAction = useCallback(async () => {
    const status = await requestLocationPermission();
    if (status === 'granted') {
      await initializeLocation({ forceRefresh: true });
    }
  }, [initializeLocation, requestLocationPermission]);

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
    if (!isLocationGranted) return;
    await loadHomeData({ showFullScreenLoader: false });
  });

  useFocusEffect(
    useCallback(() => {
      if (isLocationPermissionPending) {
        setLoading(true);
        setHomeData(null);
        setError(null);
        setCityUnavailable(false);
        return;
      }

      if (!selectedCity) {
        setLoading(isLocationPending);
        setHomeData(null);
        setError(null);
        setCityUnavailable(isLocationGranted && !isLocationPending);
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
    }, [isLocationGranted, isLocationPending, isLocationPermissionPending, loadHomeData, selectedCity]),
  );

  const nearbyJobs = useMemo(
    () => (Array.isArray(homeData?.availableNearbyJobs) ? homeData.availableNearbyJobs : []),
    [homeData?.availableNearbyJobs],
  );
  const shouldShowCurrentStatusBanner = homeData?.currentStatus?.showStatusInUi === true;

  useEffect(() => {
    if (!isAuthenticated) {
      autoGoOnlineWorkerIdRef.current = null;
      return;
    }

    if (!workerId || isWorkerLiveOnline || !isLocationGranted) {
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
  }, [goWorkerLiveOnline, isAuthenticated, isLocationGranted, isWorkerLiveOnline, workerId]);

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

  if ((isLocationPermissionPending || isLocationGranted) && (loading || isLocationPending) && !homeData) {
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
      contentContainerStyle={{
        paddingHorizontal: HOME_SCREEN_SPACING.contentHorizontal,
        paddingTop: HOME_SCREEN_SPACING.contentTop,
        paddingBottom: HOME_SCREEN_SPACING.contentBottom,
      }}
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
      <View className="flex-row items-center justify-between" style={{ marginBottom: HOME_SCREEN_SPACING.headerBottom }}>
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

      {!isLocationGranted ? (
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
      ) : null}

      {isLocationGranted ? (
        <>
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
                  containerClassName={HOME_SCREEN_SPACING.bannerTopClassName}
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

              {nearbyJobs.length > 0 ? (
                <View className="mt-4">
                  <SectionHeaderRow
                    title={APP_TEXT.home.nearbyJobsTitle}
                    onPressAction={homeData.isMoreThanThreeAvailableJobs ? () => {
                      navigation.navigate(ROOT_SCREENS.mainTabsNavigator, {
                        screen: MAIN_TAB_SCREENS.jobs,
                        params: {
                          screen: JOB_STACK_SCREENS.home,
                          params: {
                            initialTab: 'NEW_JOBS',
                            initialTabRequestKey: Date.now(),
                          },
                        },
                      });
                    } : undefined}
                  />
                  <View className="mt-2 gap-3">
                    {nearbyJobs.map((job, index) => {
                      const id = job.id ?? `${job.title ?? APP_TEXT.home.jobFallback}-${index}`;
                      const jobId = job.booking?.id ?? job.id;
                      return (
                        <WorkerNearbyGoldenJobCard
                          key={id}
                          item={job}
                          isDark={isDark}
                          onPress={jobId ? () => {
                            navigation.navigate(ROOT_SCREENS.jobDetailsNavigator, {
                              screen: JOB_STACK_SCREENS.details,
                              params: { jobId, inviteStatus: job.invite?.inviteStatus ?? null },
                            });
                          } : undefined}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}

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
        </>
      ) : null}
    </GradientScreen>
  );
}
