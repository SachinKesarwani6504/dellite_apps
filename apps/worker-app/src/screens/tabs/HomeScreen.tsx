import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { getWorkerHome } from '@/actions';
import { AppSpinner } from '@/components/common/AppSpinner';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { WorkerCurrentStatusBanner } from '@/components/common/WorkerCurrentStatusBanner';
import { useAuthContext } from '@/contexts/AuthContext';
import { WorkerHomeData, WorkerHomeNearbyJob } from '@/types/auth';
import { APP_TEXT } from '@/utils/appText';
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

function getJobTitle(job: WorkerHomeNearbyJob) {
  return job.title ?? job.name ?? APP_TEXT.home.jobFallback;
}

function getJobSchedule(job: WorkerHomeNearbyJob) {
  return job.timeRange ?? job.schedule ?? '';
}

export function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const { me } = useAuthContext();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [homeData, setHomeData] = useState<WorkerHomeData>({ availableNearbyJobs: [] });

  const loadHomeData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getWorkerHome();
      setHomeData(data);
    } catch {
      setHomeData({ availableNearbyJobs: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData(false);
    }, [loadHomeData]),
  );

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    void loadHomeData(true);
  }, [loadHomeData, refreshing]);

  const onTopBarLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0 && height !== topBarHeight) setTopBarHeight(height);
  }, [topBarHeight]);

  const currentCity = useMemo(() => {
    const workerLink = me?.links?.worker as Record<string, unknown> | undefined;
    const roleLink = (me as Record<string, unknown> | undefined)?.roleLink as Record<string, unknown> | undefined;
    const nearbyJobCity = Array.isArray(homeData.availableNearbyJobs)
      ? homeData.availableNearbyJobs.find(job => typeof job.city === 'string' && job.city.trim().length > 0)?.city
      : undefined;
    const candidates: unknown[] = [
      workerLink?.currentCityName,
      workerLink?.currentCity,
      workerLink?.city,
      roleLink?.currentCityName,
      roleLink?.currentCity,
      roleLink?.city,
      homeData.footerActions?.currentCity,
      homeData.headerBanner?.currentCity,
      nearbyJobCity,
    ];
    for (let index = 0; index < candidates.length; index += 1) {
      const value = candidates[index];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return APP_TEXT.home.cityFallback;
  }, [homeData.availableNearbyJobs, homeData.footerActions?.currentCity, homeData.headerBanner?.currentCity, me]);
  const status = String(homeData.currentStatus?.status ?? '').trim().toUpperCase();
  const activeValue = String(homeData.footerActions?.activeStatusValue ?? APP_TEXT.home.currentStatusActiveValue).trim().toUpperCase();
  const shouldShowCurrentStatus = Boolean(status) && status !== activeValue;

  const nearbyJobs = Array.isArray(homeData.availableNearbyJobs) ? homeData.availableNearbyJobs : [];
  const headerBannerName = homeData.headerBanner?.name?.trim() || APP_TEXT.home.welcomeFallbackName;
  const averageRating = typeof homeData.headerBanner?.averageRating === 'number'
    ? homeData.headerBanner.averageRating.toFixed(1)
    : APP_TEXT.home.ratingFallback;
  const reviewsCount = typeof homeData.headerBanner?.reviewsCount === 'number'
    ? homeData.headerBanner.reviewsCount
    : 0;
  const headerBannerImage = homeData.headerBanner?.imageUrl;

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
      floatingBackgroundTopInset={topBarHeight + 16}
    >
      <View className="mb-4 flex-row items-center justify-between" onLayout={onTopBarLayout}>
        <Image source={logo} resizeMode="contain" style={{ width: 104, height: 30 }} />
        <View
          className="flex-row items-center rounded-full border px-3 py-1.5"
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
          }}
        >
          <Ionicons name="location-outline" size={13} color={theme.colors.primary} />
          <Text className="ml-1 text-xs font-semibold text-primary">{currentCity}</Text>
        </View>
      </View>

      {shouldShowCurrentStatus ? (
        <WorkerCurrentStatusBanner currentStatus={homeData.currentStatus ?? null} />
      ) : null}

      <View className={shouldShowCurrentStatus ? 'mt-4' : ''}>
        <ImageBackground
          source={headerBannerImage ? { uri: headerBannerImage } : undefined}
          imageStyle={{ borderRadius: 16 }}
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
          }}
        >
          <View
            className="px-4 py-4"
            style={{
              backgroundColor: headerBannerImage ? 'rgba(0, 0, 0, 0.28)' : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95),
            }}
          >
            <Text className="text-xs font-semibold text-white/90">{APP_TEXT.home.welcomeBack}</Text>
            <Text className="mt-1 text-3xl font-extrabold text-white">{headerBannerName}</Text>
            <View className="mt-2 flex-row items-center">
              <Ionicons name="star" size={14} color={theme.colors.positive} />
              <Text className="ml-1 text-sm font-semibold text-white">{averageRating}</Text>
              <Text className="ml-1 text-xs text-white/85">{reviewsCount} {APP_TEXT.home.reviewsSuffix}</Text>
            </View>
          </View>
        </ImageBackground>
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
        {loading ? (
          <View className="mt-3 rounded-ui-md border p-4" style={{ borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }}>
            <View className="flex-row items-center">
              <AppSpinner size="small" color={theme.colors.primary} />
              <Text className="ml-2 text-sm text-textPrimary/70 dark:text-white/70">{APP_TEXT.home.nearbyJobsLoading}</Text>
            </View>
          </View>
        ) : nearbyJobs.length === 0 ? (
          <View className="mt-3 rounded-ui-md border p-4" style={{ borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }}>
            <Text className="text-sm text-textPrimary/70 dark:text-white/70">{APP_TEXT.home.nearbyJobsEmpty}</Text>
          </View>
        ) : (
          <View className="mt-2 gap-2">
            {nearbyJobs.map((job, index) => {
              const id = job.id ?? `${job.name ?? job.title ?? APP_TEXT.home.jobFallback}-${index}`;
              const jobTitle = getJobTitle(job);
              const jobSchedule = getJobSchedule(job);
              const price = job.priceLabel ?? formatCurrency(job.payout ?? job.price);
              const jobLocation = job.city ?? job.location;
              return (
                <Pressable
                  key={id}
                  className="flex-row overflow-hidden rounded-ui-md border"
                  style={{
                    borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight,
                    backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
                  }}
                >
                  <View className="h-20 w-20">
                    {job.imageUrl ? (
                      <Image source={{ uri: job.imageUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View className="h-full w-full items-center justify-center bg-primary/10">
                        <Ionicons name="briefcase-outline" size={18} color={theme.colors.primary} />
                      </View>
                    )}
                  </View>
                  <View className="flex-1 flex-row items-center justify-between px-3 py-2">
                    <View className="flex-1 pr-2">
                      <Text className="text-base font-semibold text-baseDark dark:text-white">{jobTitle}</Text>
                      {jobLocation ? (
                        <View className="mt-1 flex-row items-center">
                          <Ionicons name="location-outline" size={12} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
                          <Text className="ml-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                            {jobLocation}
                          </Text>
                        </View>
                      ) : null}
                      {jobSchedule ? (
                        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                          {jobSchedule}
                        </Text>
                      ) : null}
                    </View>
                    <Text className="text-sm font-bold text-primary">{price}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View className="mt-6">
        <View className="flex-row items-center">
          <Text className="text-[26px] font-extrabold text-baseDark dark:text-white">
            {homeData.footerActions?.madeWith ?? APP_TEXT.home.footerMadeWith}
          </Text>
          <Ionicons name="heart" size={18} color={theme.colors.negative} style={{ marginHorizontal: 6, marginTop: 2 }} />
          <Text className="text-[26px] font-extrabold text-baseDark dark:text-white">
            {homeData.footerActions?.from ?? APP_TEXT.home.footerFrom}
          </Text>
        </View>
        <GradientWord
          word={homeData.footerActions?.region ?? APP_TEXT.home.footerRegionFallback}
          className="mt-1 text-[36px] font-extrabold"
        />
        <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
          {homeData.footerActions?.copyright ?? APP_TEXT.home.footerCopyrightFallback}
        </Text>
      </View>
    </GradientScreen>
  );
}
