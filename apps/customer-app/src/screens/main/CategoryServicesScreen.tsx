import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ImageOverlayBanner } from '@/components/common/ImageOverlayBanner';
import { ServiceSelectionCard } from '@/components/common/ServiceSelectionCard';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import type { CustomerCatalogService, CustomerCatalogSubcategory, CustomerHomeCategory } from '@/types/customer';
import { HOME_SCREEN } from '@/types/screen-names';
import { DEFAULT_HOME_CITY } from '@/utils/options';
import { APP_TEXT } from '@/utils/appText';
import { safeImageUrl, titleCase } from '@/utils/home';
import { theme, uiColors } from '@/utils/theme';

type CategoryServicesRouteParams = {
  sourceType: 'popular_service' | 'category';
  categoryId?: string;
  subcategoryId?: string;
  serviceId?: string;
  city?: string;
};

type CategoryServicesScreenProps = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: unknown) => void;
  };
  route: {
    name: string;
    params: CategoryServicesRouteParams;
  };
};

function findCategoryById(categories: CustomerHomeCategory[], categoryId?: string) {
  if (!categoryId) return null;
  return categories.find(category => category.id === categoryId) ?? null;
}

function findCategoryByService(categories: CustomerHomeCategory[], serviceId?: string) {
  if (!serviceId) return null;
  return categories.find(category =>
    Array.isArray(category.subcategories)
      && category.subcategories.some(subcategory =>
        Array.isArray(subcategory.services) && subcategory.services.some(service => service.id === serviceId),
      ),
  ) ?? null;
}

function resolveSubcategoryById(category: CustomerHomeCategory | null, subcategoryId?: string) {
  if (!category || !subcategoryId || !Array.isArray(category.subcategories)) return null;
  return category.subcategories.find(subcategory => subcategory.id === subcategoryId) ?? null;
}

function findSubcategoryByService(category: CustomerHomeCategory | null, serviceId?: string) {
  if (!category || !serviceId || !Array.isArray(category.subcategories)) return null;
  return category.subcategories.find(subcategory =>
    Array.isArray(subcategory.services) && subcategory.services.some(service => service.id === serviceId),
  ) ?? null;
}

function getSubcategoryServiceCount(subcategory: CustomerCatalogSubcategory) {
  if (Array.isArray(subcategory.services)) return subcategory.services.length;
  if (typeof subcategory.serviceCount === 'string') {
    const parsed = Number(subcategory.serviceCount);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof subcategory.serviceCount === 'number' && Number.isFinite(subcategory.serviceCount)) {
    return subcategory.serviceCount;
  }
  return 0;
}

export function CategoryServicesScreen({ navigation, route }: CategoryServicesScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const {
    catalogLoading,
    catalogError,
    ensureCatalog,
    refreshCatalog,
    setCategory,
    setSubcategory,
    selectedServiceIds,
    selectedServices,
    toggleService,
  } = useBookingFlowContext();
  const [activeCategory, setActiveCategory] = useState<CustomerHomeCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<CustomerCatalogSubcategory | null>(null);
  const initialServiceAppliedRef = useRef(false);
  const selectedCity = route.params.city ?? DEFAULT_HOME_CITY;

  const showSubcategoryPicker = route.name === HOME_SCREEN.CATEGORY_SUBCATEGORIES;

  const resolveActiveNodes = useCallback((sourceCategories: CustomerHomeCategory[]) => {
    const resolvedCategory = findCategoryById(sourceCategories, route.params.categoryId)
      ?? findCategoryByService(sourceCategories, route.params.serviceId)
      ?? sourceCategories[0]
      ?? null;
    setActiveCategory(resolvedCategory);

    if (!resolvedCategory) {
      setActiveSubcategory(null);
      return;
    }

    setCategory({ id: resolvedCategory.id, name: resolvedCategory.name });

    const resolvedSubcategory = resolveSubcategoryById(resolvedCategory, route.params.subcategoryId)
      ?? findSubcategoryByService(resolvedCategory, route.params.serviceId)
      ?? (Array.isArray(resolvedCategory.subcategories) ? resolvedCategory.subcategories[0] ?? null : null);
    setActiveSubcategory(resolvedSubcategory);

    if (resolvedSubcategory) {
      setSubcategory({ id: resolvedSubcategory.id, name: resolvedSubcategory.name });
    }

    if (route.params.serviceId && resolvedSubcategory?.services) {
      const initialService = resolvedSubcategory.services.find(service => service.id === route.params.serviceId);
      if (initialService && !initialServiceAppliedRef.current && !selectedServiceIds[initialService.id]) {
        toggleService({
          id: initialService.id,
          name: initialService.name,
          description: initialService.description,
          iconText: initialService.iconText,
        });
        initialServiceAppliedRef.current = true;
      }
    }
  }, [
    route.params.categoryId,
    route.params.serviceId,
    route.params.subcategoryId,
    selectedServiceIds,
    setCategory,
    setSubcategory,
    toggleService,
  ]);

  const onRefreshCatalog = useCallback(async () => {
    const nextCatalog = await refreshCatalog(selectedCity);
    resolveActiveNodes(nextCatalog);
  }, [refreshCatalog, resolveActiveNodes, selectedCity]);
  const refreshControlProps = useBrandRefreshControl(onRefreshCatalog);

  useEffect(() => {
    void (async () => {
      const nextCatalog = await ensureCatalog(selectedCity);
      resolveActiveNodes(nextCatalog);
    })();
  }, [ensureCatalog, resolveActiveNodes, selectedCity]);

  const subcategories = useMemo(
    () => (Array.isArray(activeCategory?.subcategories) ? activeCategory.subcategories : []),
    [activeCategory],
  );

  const services = useMemo(
    () => (Array.isArray(activeSubcategory?.services) ? activeSubcategory.services : []),
    [activeSubcategory],
  );
  const headerBannerImage = showSubcategoryPicker
    ? (safeImageUrl(activeCategory?.mainImage?.url) ?? safeImageUrl(activeCategory?.iconImage?.url))
    : (safeImageUrl(activeSubcategory?.mainImage?.url) ?? safeImageUrl(activeSubcategory?.iconImage?.url));
  const headerBannerTitle = showSubcategoryPicker
    ? (activeCategory ? titleCase(activeCategory.name) : 'Services')
    : (activeSubcategory ? titleCase(activeSubcategory.name) : 'Services');

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
      refreshControl={<RefreshControl {...refreshControlProps} />}
    >
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <ImageOverlayBanner
        imageUrl={headerBannerImage}
        overline={showSubcategoryPicker ? APP_TEXT.main.bookingFlow.categoryTitle : APP_TEXT.main.bookingFlow.serviceTitle}
        title={headerBannerTitle}
        subtitle={showSubcategoryPicker ? APP_TEXT.main.bookingFlow.categorySubtitle : APP_TEXT.main.bookingFlow.serviceSubtitle}
        pillText={showSubcategoryPicker ? undefined : `${selectedServices.length.toString()} Selected`}
      />

        {catalogLoading ? (
        <View className="mt-10 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}

      {!catalogLoading && catalogError ? (
        <View className="mt-6 rounded-2xl border p-4" style={{ borderColor: theme.colors.negative, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight90 }}>
          <Text className="text-sm font-semibold" style={{ color: theme.colors.negative }}>{catalogError}</Text>
          <View className="mt-3">
            <Button label={APP_TEXT.main.bookingFlow.retry} onPress={() => void onRefreshCatalog()} />
          </View>
        </View>
      ) : null}

      {!catalogLoading && !catalogError && showSubcategoryPicker ? (
        <View className="mt-4 gap-3">
          {subcategories.length === 0 ? (
            <Text className="text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.main.bookingFlow.noSubcategory}
            </Text>
          ) : null}
          {subcategories.map(subcategory => {
            const imageUrl = safeImageUrl(subcategory.mainImage?.url) ?? safeImageUrl(subcategory.iconImage?.url);
            const serviceCount = getSubcategoryServiceCount(subcategory);
            const label = serviceCount === 1 ? 'service' : 'services';

            return (
              <ServiceSelectionCard
                key={subcategory.id}
                onPress={() => {
                  setSubcategory({ id: subcategory.id, name: subcategory.name });
                  navigation.navigate(HOME_SCREEN.SUBCATEGORY_SERVICES, {
                    sourceType: 'category',
                    categoryId: activeCategory?.id,
                    subcategoryId: subcategory.id,
                  });
                }}
                title={titleCase(subcategory.name)}
                description={subcategory.description}
                imageUrl={imageUrl}
                metaText={`${serviceCount.toString()} ${label}`}
                isDark={isDark}
              />
            );
          })}
        </View>
      ) : null}

      {!catalogLoading && !catalogError && !showSubcategoryPicker ? (
        <>
          <ScrollView className="mt-4" contentContainerStyle={{ paddingBottom: 8 }}>
            <View className="gap-3">
              {services.length === 0 ? (
                <Text className="text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {APP_TEXT.main.bookingFlow.noService}
                </Text>
              ) : null}
              {services.map(service => {
                const selected = Boolean(selectedServiceIds[service.id]);
                const imageUrl = safeImageUrl(service.mainImage?.url) ?? safeImageUrl(service.iconImage?.url);
                return (
                  <ServiceSelectionCard
                    key={service.id}
                    onPress={() => {
                      toggleService({
                        id: service.id,
                        name: service.name,
                        description: service.description,
                        iconText: service.iconText,
                      });
                    }}
                    title={titleCase(service.name)}
                    description={service.description}
                    imageUrl={imageUrl}
                    isDark={isDark}
                    selected={selected}
                  />
                );
              })}
            </View>
          </ScrollView>

          <View className="mt-4">
            <Button
              label={APP_TEXT.main.bookingFlow.continueCta}
              disabled={selectedServices.length === 0}
              onPress={() => {
                navigation.navigate(HOME_SCREEN.BOOKING_DETAILS);
              }}
            />
          </View>
        </>
      ) : null}
    </GradientScreen>
  );
}
