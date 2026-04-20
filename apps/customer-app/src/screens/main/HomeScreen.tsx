import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { customerActions } from '@/actions';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { ImageOverlayBanner } from '@/components/common/ImageOverlayBanner';
import { WorkerSkillCategoryGrid } from '@/components/worker-skills/WorkerSkillCategoryGrid';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { useLocation } from '@/hooks/useLocation';
import type { CustomerHomePayload, CustomerHomeService } from '@/types/customer';
import { HOME_SCREEN } from '@/types/screen-names';
import { DEFAULT_HOME_CITY, formatTitle, palette, safeImageUrl, theme, uiColors } from '@/utils';

const LOGO = require('@/assets/images/png/dellite_logo.png');
const HOME_DOODLES = require('@/assets/images/png/home_page_doddles.png');

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Unable to load home data right now.';
}

function getPopularFallbackLabel(service: CustomerHomeService) {
  if (service.iconText?.trim()) return service.iconText.trim();
  if (service.category?.iconText?.trim()) return service.category.iconText.trim();
  if (service.name?.trim()) return service.name.trim().charAt(0).toUpperCase();
  return '?';
}

export function HomeScreen({ navigation }: { navigation: { navigate: (screen: string, params?: unknown) => void } }) {
  const { beginFlow } = useBookingFlowContext();
  const { city } = useLocation();
  const isDark = useColorScheme() === 'dark';
  const selectedCity = city?.trim() || DEFAULT_HOME_CITY;
  const [homeData, setHomeData] = useState<CustomerHomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedPopularImages, setFailedPopularImages] = useState<Record<string, true>>({});

  const popularServices = useMemo(
    () => (Array.isArray(homeData?.popularServices) ? homeData.popularServices : []),
    [homeData?.popularServices],
  );
  const allServices = useMemo(
    () => (Array.isArray(homeData?.allServices) ? homeData.allServices : []),
    [homeData?.allServices],
  );
  const whyDellite = useMemo(
    () => (Array.isArray(homeData?.whyDellite) ? homeData.whyDellite : []),
    [homeData?.whyDellite],
  );

  const fetchHome = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await customerActions.getCustomerHome(selectedCity);
      setHomeData(data);
      setFailedPopularImages({});
    } catch (fetchError) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [selectedCity]);

  useEffect(() => {
    const cached = customerActions.getCachedCustomerHome(selectedCity);
    if (cached) {
      setHomeData(cached);
      setLoading(false);
      void fetchHome(false);
      return;
    }
    void fetchHome(true);
  }, [fetchHome, selectedCity]);

  const refreshControlProps = useBrandRefreshControl(async () => {
    await fetchHome(false);
  });

  const onOpenService = useCallback((service: CustomerHomeService) => {
    beginFlow({
      sourceType: 'popular_service',
      categoryId: service.category?.id,
    });
    navigation.navigate(HOME_SCREEN.SUBCATEGORY_SERVICES, {
      sourceType: 'popular_service',
      categoryId: service.category?.id,
      serviceId: service.id,
      city: selectedCity,
    });
  }, [beginFlow, navigation, selectedCity]);

  const onOpenCategory = useCallback((categoryId: string, categoryName?: string) => {
    void categoryName;
    beginFlow({
      sourceType: 'category',
      categoryId,
    });
    navigation.navigate(HOME_SCREEN.CATEGORY_SUBCATEGORIES, {
      sourceType: 'category',
      categoryId,
      city: selectedCity,
    });
  }, [beginFlow, navigation, selectedCity]);

  const headerTitle = homeData?.header?.title ?? 'Home';
  const headerSubtitle = homeData?.header?.subtitle ?? '';
  const currentCity = useMemo(() => {
    const subtitle = headerSubtitle.trim();
    const cityMatch = subtitle.match(/\bin\s+([A-Za-z\s]+)$/i);
    if (cityMatch?.[1]?.trim()) {
      return cityMatch[1].trim();
    }
    return selectedCity;
  }, [headerSubtitle, selectedCity]);

  if (loading && !homeData) {
    return (
      <GradientScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </GradientScreen>
    );
  }

  return (
    <GradientScreen
      contentContainerStyle={{ padding: 0 }}
      floatingBackground={(
        <Image
          source={HOME_DOODLES}
          resizeMode="cover"
          className="h-full w-full"
          style={{ opacity: isDark ? 0.08 : 0.2 }}
        />
      )}
      floatingBackgroundTopInset={0}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl {...refreshControlProps} />}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Image source={LOGO} resizeMode="contain" style={{ width: 104, height: 30 }} />
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

        {error && !homeData ? (
          <View
            className="rounded-2xl border p-4"
            style={{
              borderColor: theme.colors.negative,
              backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayLight85,
            }}
          >
            <Text className="text-sm font-semibold" style={{ color: theme.colors.negative }}>
              {error}
            </Text>
            <View className="mt-3">
              <Button label="Retry" onPress={() => void fetchHome(true)} />
            </View>
          </View>
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
            <ImageOverlayBanner
              imageUrl={homeData.header?.bannerImageUrl}
              overline="Discover"
              title={headerTitle}
              subtitle={headerSubtitle}
            />
            {homeData.header?.searchPlaceholder ? (
              <View
                className="mt-3 flex-row items-center rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
                }}
              >
                <Ionicons name="search-outline" size={14} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
                <Text className="ml-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {homeData.header.searchPlaceholder}
                </Text>
              </View>
            ) : null}

            <View className="mt-5">
              {popularServices.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 2 }}>
                  <View className="flex-row gap-3">
                    {popularServices.map(service => {
                      const imageUrl = safeImageUrl(service.mainImage?.url);
                      const hideImage = !imageUrl || Boolean(failedPopularImages[service.id]);
                      return (
                        <Pressable
                          key={service.id}
                          className="h-44 w-60 overflow-hidden rounded-2xl border"
                          style={{
                            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                            backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card,
                          }}
                          onPress={() => onOpenService(service)}
                        >
                          <ImageBackground
                            source={hideImage ? undefined : { uri: imageUrl as string }}
                            resizeMode="cover"
                            style={{ flex: 1 }}
                            onError={() => setFailedPopularImages(prev => ({ ...prev, [service.id]: true }))}
                          >
                            <LinearGradient
                              colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 12 }}
                            >
                              {hideImage ? (
                                <View className="mb-2 self-start rounded-md bg-white/90 px-2 py-1">
                                  <Text className="text-[10px] font-bold text-primary">{getPopularFallbackLabel(service)}</Text>
                                </View>
                              ) : null}
                              <Text className="text-base font-extrabold text-white">
                                {formatTitle(service.name)}
                              </Text>
                              <Text className="mt-1 text-xs text-white/90" numberOfLines={2}>
                                {service.description?.trim() || 'Service details available soon.'}
                              </Text>
                            </LinearGradient>
                          </ImageBackground>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : (
                <View
                  className="mt-2 rounded-xl border px-3 py-3"
                  style={{
                    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
                  }}
                >
                  <Text className="text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    No popular services available right now.
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-5">
              {allServices.length > 0 ? (
                <WorkerSkillCategoryGrid
                  categories={allServices}
                  selectedCategoryId={null}
                  isDark={isDark}
                  onSelectCategory={(category) => {
                    onOpenCategory(category.id, category.name);
                  }}
                />
              ) : (
                <View
                  className="mt-2 rounded-xl border px-3 py-3"
                  style={{
                    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
                  }}
                >
                  <Text className="text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    No categories available right now.
                  </Text>
                </View>
              )}
            </View>

            {whyDellite.length > 0 ? (
              <View
                className="mt-6 rounded-2xl border px-4 py-4"
                style={{
                  borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
                }}
              >
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {whyDellite.map((point, index) => (
                    <View key={`${point}-${index}`} className="w-[48%] flex-row items-center">
                      <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.primary} />
                      <Text className="ml-2 text-sm font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {homeData.footer ? (
              <View className="mt-6">
                {(homeData.footer.madeWith || homeData.footer.from) ? (
                  <View className="flex-row items-center">
                    {homeData.footer.madeWith ? (
                      <Text className="text-[26px] font-extrabold text-baseDark dark:text-white">
                        {homeData.footer.madeWith}
                      </Text>
                    ) : null}
                    <Ionicons name="heart" size={18} color={theme.colors.negative} style={{ marginHorizontal: 6, marginTop: 2 }} />
                    {homeData.footer.from ? (
                      <Text className="text-[26px] font-extrabold text-baseDark dark:text-white">
                        {homeData.footer.from}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {homeData.footer.region ? (
                  <GradientWord
                    word={homeData.footer.region}
                    className="mt-1 text-[36px] font-extrabold"
                  />
                ) : null}
                {homeData.footer.copyright ? (
                  <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                    {homeData.footer.copyright}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          !loading && (
            <View
              className="rounded-2xl border p-4"
              style={{
                borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
              }}
            >
              <Text className="text-sm font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                No home content available for now.
              </Text>
              <View className="mt-3">
                <Button label="Retry" onPress={() => void fetchHome(true)} />
              </View>
            </View>
          )
        )}
      </ScrollView>
    </GradientScreen>
  );
}
