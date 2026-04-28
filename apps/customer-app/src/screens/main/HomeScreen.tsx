import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { customerActions } from '@/actions';
import { AppImage } from '@/components/common/AppImage';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { CityAvailabilityNotice } from '@/components/common/CityAvailabilityNotice';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { ImageOverlayBanner } from '@/components/common/ImageOverlayBanner';
import { LoadingState } from '@/components/common/LoadingState';
import { ServiceHeroCard } from '@/components/common/ServiceHeroCard';
import { WorkerSkillCategoryGrid } from '@/components/worker-skills/WorkerSkillCategoryGrid';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import { ApiError } from '@/types/api';
import type {
  CustomerHomeCategory,
  CustomerHomeContentSection,
  CustomerHomePayload,
  CustomerHomeService,
} from '@/types/customer';
import { HOME_SCREEN, ROOT_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { getErrorMessage, palette, safeImageUrl, theme, titleCase, uiColors } from '@/utils';

const LOGO = require('@/assets/images/png/dellite_logo.png');
const HOME_DOODLES = require('@/assets/images/png/home_page_doddles.png');

function normalizeForCompare(value?: string | null) {
  if (!value || !value.trim()) return '';
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function extractFooterOnlyHomePayload(payload: unknown): Pick<CustomerHomePayload, 'footer' | 'header'> | null {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as { data?: unknown; footer?: unknown; header?: unknown };
  const data = (source.data && typeof source.data === 'object')
    ? source.data as { footer?: unknown; header?: unknown }
    : null;

  const footer = (data?.footer && typeof data.footer === 'object')
    ? data.footer as CustomerHomePayload['footer']
    : (source.footer && typeof source.footer === 'object')
      ? source.footer as CustomerHomePayload['footer']
      : undefined;

  const header = (data?.header && typeof data.header === 'object')
    ? data.header as CustomerHomePayload['header']
    : (source.header && typeof source.header === 'object')
      ? source.header as CustomerHomePayload['header']
      : undefined;

  if (!footer && !header) return null;
  return { header, footer };
}

function normalizeHomeQueryCity(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'your area') return '';
  return trimmed.toUpperCase();
}

function getPopularFallbackLabel(service: CustomerHomeService) {
  if (service.iconText?.trim()) return service.iconText.trim();
  if (service.category?.iconText?.trim()) return service.category.iconText.trim();
  if (service.name?.trim()) return service.name.trim().charAt(0).toUpperCase();
  return '?';
}

function isCustomerHomeService(value: unknown): value is CustomerHomeService {
  if (!value || typeof value !== 'object') return false;
  const source = value as { id?: unknown; name?: unknown };
  return typeof source.id === 'string' && typeof source.name === 'string';
}

function isCustomerHomeCategory(value: unknown): value is CustomerHomeCategory {
  if (!value || typeof value !== 'object') return false;
  const source = value as { id?: unknown; name?: unknown };
  return typeof source.id === 'string' && typeof source.name === 'string';
}

export function HomeScreen({ navigation }: { navigation: { navigate: (screen: string, params?: unknown) => void } }) {
  const { locationState } = useAuthContext();
  const { beginFlow } = useBookingFlowContext();
  const {
    city,
    locality,
    state,
    formattedAddress,
    latitude,
    longitude,
    initialized,
    loading: locationLoading,
    refreshing: locationRefreshing,
  } = locationState;
  const isDark = useColorScheme() === 'dark';
  const resolvedLocation = useMemo(() => resolveProductLocation({
    city,
    locality,
    state,
    formattedAddress,
    latitude,
    longitude,
  }), [city, formattedAddress, latitude, locality, longitude, state]);
  const selectedCity = resolvedLocation.serviceableCity ?? '';
  const homeQueryCity = useMemo(() => {
    return normalizeHomeQueryCity(
      resolvedLocation.resolvedCity
      ?? city
      ?? locality
      ?? resolvedLocation.displayCity,
    );
  }, [city, locality, resolvedLocation.displayCity, resolvedLocation.resolvedCity]);
  const [homeData, setHomeData] = useState<CustomerHomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityUnavailable, setCityUnavailable] = useState(false);
  const [failedPopularImages, setFailedPopularImages] = useState<Record<string, true>>({});
  const isLocationPending = (!initialized || locationLoading || locationRefreshing) && !resolvedLocation.displayCity;

  const contentSections = useMemo(
    () => (Array.isArray(homeData?.content) ? homeData.content : []),
    [homeData?.content],
  );

  const fetchHome = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    setCityUnavailable(false);
    if (!homeQueryCity) {
      setLoading(false);
      setError(null);
      setCityUnavailable(true);
      return;
    }
    try {
      const data = await customerActions.getCustomerHome(homeQueryCity);
      setHomeData(data);
      setFailedPopularImages({});
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.statusCode === 404) {
        setCityUnavailable(true);
        setError(null);
        const footerOnlyPayload = extractFooterOnlyHomePayload(fetchError.payload);
        if (footerOnlyPayload) {
          setHomeData({
            header: footerOnlyPayload.header,
            footer: footerOnlyPayload.footer,
            content: [],
          });
        } else {
          setHomeData(null);
        }
      } else {
        setError(getErrorMessage(fetchError, APP_TEXT.main.homeLoadError));
      }
    } finally {
      setLoading(false);
    }
  }, [homeQueryCity]);

  useEffect(() => {
    if (!homeQueryCity) {
      setLoading(isLocationPending);
      setHomeData(null);
      setCityUnavailable(!isLocationPending);
      return;
    }

    const cached = customerActions.getCachedCustomerHome(homeQueryCity);
    if (cached) {
      setHomeData(cached);
      setLoading(false);
      void fetchHome(false);
      return;
    }
    void fetchHome(true);
  }, [fetchHome, homeQueryCity, isLocationPending]);

  const refreshControlProps = useBrandRefreshControl(async () => {
    await fetchHome(false);
  });

  const onOpenService = useCallback((service: CustomerHomeService) => {
    beginFlow({
      sourceType: 'popular_service',
      categoryId: service.category?.id,
    });
    navigation.navigate(ROOT_SCREEN.BOOKING_FLOW_NAVIGATOR, {
      screen: HOME_SCREEN.SUBCATEGORY_SERVICES,
      params: {
        sourceType: 'popular_service',
        categoryId: service.category?.id,
        serviceId: service.id,
        city: selectedCity,
      },
    });
  }, [beginFlow, navigation, selectedCity]);

  const onOpenCategory = useCallback((categoryId: string, categoryName?: string) => {
    void categoryName;
    beginFlow({
      sourceType: 'category',
      categoryId,
    });
    navigation.navigate(ROOT_SCREEN.BOOKING_FLOW_NAVIGATOR, {
      screen: HOME_SCREEN.CATEGORY_SUBCATEGORIES,
      params: {
        sourceType: 'category',
        categoryId,
        city: selectedCity,
      },
    });
  }, [beginFlow, navigation, selectedCity]);

  const renderContentSection = useCallback((section: CustomerHomeContentSection, index: number) => {
    const topSpacingClass = index === 0 ? 'mt-5' : 'mt-6';
    const sectionTitle = section.title?.trim();

    if (section.type === 'service') {
      const services = (Array.isArray(section.data) ? section.data : []).filter(isCustomerHomeService);
      return (
        <View key={`service-${sectionTitle ?? index.toString()}`} className={topSpacingClass}>
          {sectionTitle ? (
            <Text className="text-lg font-bold text-baseDark dark:text-white">{sectionTitle}</Text>
          ) : null}
          {services.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 2 }}>
              <View className="flex-row gap-3">
                {services.map(service => {
                  const imageUrl = safeImageUrl(service.mainImage?.url);
                  const hideImage = !imageUrl || Boolean(failedPopularImages[service.id]);
                  return (
                    <ServiceHeroCard
                      key={service.id}
                      title={service.name}
                      imageUrl={hideImage ? null : imageUrl}
                      onPress={() => onOpenService(service)}
                      onImageError={() => setFailedPopularImages(prev => ({ ...prev, [service.id]: true }))}
                    />
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
      );
    }

            if (section.type === 'category') {
      const categories = (Array.isArray(section.data) ? section.data : []).filter(isCustomerHomeCategory);
      return (
        <View key={`category-${sectionTitle ?? index.toString()}`} className={topSpacingClass}>
          {sectionTitle ? (
            <Text className="text-lg font-bold text-baseDark dark:text-white">{sectionTitle}</Text>
          ) : null}
          {categories.length > 0 ? (
            <WorkerSkillCategoryGrid
              categories={categories}
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
      );
    }

    if (sectionTitle?.toLowerCase() === 'why dellite') {
      const points = (Array.isArray(section.data) ? section.data : [])
        .map(item => {
          const source = item as { title?: unknown };
          return typeof source.title === 'string' ? source.title : '';
        })
        .filter((item): item is string => item.trim().length > 0);

      if (points.length === 0) {
        return null;
      }

      return (
        <View
          key={`why-dellite-${index.toString()}`}
          className={`${topSpacingClass} rounded-2xl border px-4 py-4`}
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
          }}
        >
          <Text className="mb-3 text-xl font-extrabold text-baseDark dark:text-white">{sectionTitle}</Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {points.map((point, pointIndex) => (
              <View key={`${point}-${pointIndex}`} className="w-[48%] flex-row items-center">
                <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.primary} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return null;
  }, [failedPopularImages, isDark, onOpenCategory, onOpenService]);

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
  const cityLabel = currentCity || resolvedLocation.displayCity || 'Locating...';
  const displayCityLabel = cityLabel === 'Locating...' ? cityLabel : titleCase(cityLabel);
  const shouldShowBanner = Boolean(
    (homeData?.header?.title && homeData.header.title.trim().length > 0)
    || (homeData?.header?.subtitle && homeData.header.subtitle.trim().length > 0)
    || (homeData?.header?.bannerImageUrl && homeData.header.bannerImageUrl.trim().length > 0),
  );
  const shouldShowContent = !cityUnavailable && contentSections.length > 0;

  useEffect(() => {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console.log('[home][customer] city state', {
      city,
      locality,
      state,
      formattedAddress,
      resolvedLocation,
      selectedCity,
      cityLabel,
      initialized,
      locationLoading,
      locationRefreshing,
    });
  }, [city, cityLabel, formattedAddress, initialized, locality, locationLoading, locationRefreshing, resolvedLocation, selectedCity, state]);

  const isHomePayloadEmpty = !homeData || (!shouldShowBanner && !shouldShowContent && !homeData.footer);

  if ((loading || isLocationPending) && isHomePayloadEmpty) {
    return (
      <GradientScreen>
        <View className="px-4 pt-6">
          <LoadingState minHeight={520} message={APP_TEXT.main.loadingHome} />
        </View>
      </GradientScreen>
    );
  }

  return (
    <GradientScreen
      contentContainerStyle={{ padding: 0 }}
      floatingBackground={(
        <AppImage
          source={HOME_DOODLES}
          resizeMode="cover"
          className="h-full w-full"
          style={{ opacity: isDark ? 0.08 : 0.2 }}
        />
      )}
      floatingBackgroundTopInset={0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl {...refreshControlProps} />}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <AppImage source={LOGO} resizeMode="contain" style={{ width: 104, height: 30 }} />
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

        {cityUnavailable ? (
          <CityAvailabilityNotice cityLabel={resolvedLocation.displayCity} />
        ) : null}

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
            {shouldShowBanner ? (
              <ImageOverlayBanner
                imageUrl={homeData.header?.bannerImageUrl}
                overline="Discover"
                title={headerTitle}
                subtitle={headerSubtitle}
              />
            ) : null}

            {shouldShowContent ? contentSections.map((section, index) => renderContentSection(section, index)) : null}

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
          !loading && !cityUnavailable && (
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
