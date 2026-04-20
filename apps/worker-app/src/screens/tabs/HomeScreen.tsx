import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Image, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { getCachedWorkerHome, getWorkerHome } from '@/actions';
import { AppSpinner } from '@/components/common/AppSpinner';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { ImageOverlayBanner } from '@/components/common/ImageOverlayBanner';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { NearbyJobCard } from '@/components/common/NearbyJobCard';
import { WorkerCurrentStatusBanner } from '@/components/common/WorkerCurrentStatusBanner';
import { useAuthContext } from '@/contexts/AuthContext';
import type { WorkerHomeData } from '@/types/auth';
import { APP_TEXT } from '@/utils/appText';
import { DEFAULT_HOME_CITY } from '@/utils/options';
import { palette, theme, uiColors } from '@/utils/theme';

const logo = require('@/assets/images/png/dellite_logo.png');
const homePageDoodles = require('@/assets/images/png/home_page_doddles.png');

function formatCurrency(value?: number) {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `\u20B9${amount.toLocaleString('en-IN')}`;
}

function formatGrowth(value?: number | string) {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  const growth = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const sign = growth > 0 ? '+' : '';
  return `${sign}${growth}%`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Unable to load home data right now.';
}

export function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const { locationState } = useAuthContext();
  const { city } = locationState;
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const selectedCity = city?.trim() || DEFAULT_HOME_CITY;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<WorkerHomeData | null>(null);

  const loadHomeData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await getWorkerHome(selectedCity);
      setHomeData(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity]);

  useFocusEffect(
    useCallback(() => {
      const cached = getCachedWorkerHome(selectedCity);
      if (cached) {
        setHomeData(cached);
        setLoading(false);
        void loadHomeData(false);
        return;
      }
      void loadHomeData(true);
    }, [loadHomeData, selectedCity]),
  );

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    void loadHomeData(false);
  }, [loadHomeData, refreshing]);

  const nearbyJobs = useMemo(
    () => (Array.isArray(homeData?.availableNearbyJobs) ? homeData.availableNearbyJobs : []),
    [homeData?.availableNearbyJobs],
  );
  const headerBannerName = homeData?.headerBanner?.name?.trim() || APP_TEXT.home.welcomeFallbackName;
  const ratingLabel = useMemo(() => {
    const averageRating = typeof homeData?.headerBanner?.averageRating === 'number'
      ? homeData.headerBanner.averageRating.toFixed(1)
      : APP_TEXT.home.ratingFallback;
    const reviewsCount = typeof homeData?.headerBanner?.reviewsCount === 'number'
      ? homeData.headerBanner.reviewsCount.toLocaleString('en-IN')
      : '0';
    return `${averageRating} (${reviewsCount} ${APP_TEXT.home.reviewsSuffix})`;
  }, [homeData?.headerBanner?.averageRating, homeData?.headerBanner?.reviewsCount]);

  if (loading && !homeData) {
    return (
      <GradientScreen>
        <View className="flex-1 items-center justify-center">
          <AppSpinner size="large" color={theme.colors.primary} />
        </View>
      </GradientScreen>
    );
  }

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
        <Image
          source={homePageDoodles}
          resizeMode="cover"
          className="h-full w-full"
          style={{ opacity: isDark ? 0.08 : 0.22 }}
        />
      )}
      floatingBackgroundTopInset={0}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <Image source={logo} resizeMode="contain" style={{ width: 104, height: 30 }} />
        <View
          className="flex-row items-center rounded-full border px-3 py-1.5"
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
          }}
        >
          <Ionicons name="location-outline" size={13} color={theme.colors.primary} />
          <Text className="ml-1 text-xs font-semibold text-primary">{selectedCity}</Text>
        </View>
      </View>

      {error && !homeData ? (
        <ListErrorState
          title="Could not load home"
          description={error}
          onAction={() => {
            void loadHomeData(true);
          }}
        />
      ) : null}

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
          {homeData.currentStatus ? (
            <WorkerCurrentStatusBanner currentStatus={homeData.currentStatus} />
          ) : null}

          <View className={homeData.currentStatus ? 'mt-4' : ''}>
            <ImageOverlayBanner
              imageUrl={homeData.headerBanner?.imageUrl}
              overline={APP_TEXT.home.welcomeBack}
              title={headerBannerName}
              subtitle={ratingLabel}
              pillText={selectedCity}
            />
          </View>

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
              <Text className="mt-2 text-2xl font-bold text-baseDark dark:text-white">{formatCurrency(homeData.todayStats?.totalEarning)}</Text>
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
              <Text className="mt-2 text-2xl font-bold text-baseDark dark:text-white">{formatGrowth(homeData.todayStats?.growth)}</Text>
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
                      payoutLabel={formatCurrency(job.payout)}
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
