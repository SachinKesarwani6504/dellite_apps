import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { CityAvailabilityNotice } from '@/components/common/CityAvailabilityNotice';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ImageOverlayBanner } from '@/components/common/ImageOverlayBanner';
import { ServiceSelectionCard } from '@/components/common/ServiceSelectionCard';
import { ServiceHeroCard } from '@/components/common/ServiceHeroCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import type { CustomerBookableService, CustomerCatalogSubcategory, CustomerHomeCategory } from '@/types/customer';
import { HOME_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { createBookingFlowService, safeImageUrl, titleCase } from '@/utils';
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
  const { width: screenWidth } = useWindowDimensions();
  const { locationState } = useAuthContext();
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
  const {
    catalogLoading,
    catalogError,
    ensureCatalog,
    refreshCatalog,
    setCategory,
    setSubcategory,
    selectedServiceIds,
    selectedServices,
    clearSubcategorySelection,
    toggleService,
  } = useBookingFlowContext();
  const [activeCategory, setActiveCategory] = useState<CustomerHomeCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<CustomerCatalogSubcategory | null>(null);
  const initialServiceAppliedRef = useRef(false);
  const selectedCity = route.params.city ?? resolvedLocation.serviceableCity ?? '';

  const showSubcategoryPicker = route.name === HOME_SCREEN.CATEGORY_SUBCATEGORIES;

  // When returning from service selection back to the subcategory list,
  // clear selected services so the user can choose another subcategory fresh.
  useFocusEffect(
    useCallback(() => {
      if (!showSubcategoryPicker) return;
      clearSubcategorySelection();
    }, [clearSubcategorySelection, showSubcategoryPicker]),
  );

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
        toggleService(createBookingFlowService({
          ...initialService,
          category: resolvedCategory,
          subCategory: resolvedSubcategory,
        }));
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
    if (!selectedCity) return;
    const nextCatalog = await refreshCatalog(selectedCity);
    resolveActiveNodes(nextCatalog);
  }, [refreshCatalog, resolveActiveNodes, selectedCity]);
  const refreshControlProps = useBrandRefreshControl(onRefreshCatalog);

  useEffect(() => {
    void (async () => {
      if (!selectedCity) return;
      const nextCatalog = await ensureCatalog(selectedCity);
      resolveActiveNodes(nextCatalog);
    })();
  }, [ensureCatalog, resolveActiveNodes, selectedCity]);

  const subcategories = useMemo(
    () => (Array.isArray(activeCategory?.subcategories) ? activeCategory.subcategories : []),
    [activeCategory],
  );

  const services = useMemo(
    () => (Array.isArray(activeSubcategory?.services) ? activeSubcategory.services as CustomerBookableService[] : []),
    [activeSubcategory],
  );
  const headerBannerImage = showSubcategoryPicker
    ? (safeImageUrl(activeCategory?.mainImage?.url) ?? safeImageUrl(activeCategory?.iconImage?.url))
    : (safeImageUrl(activeSubcategory?.mainImage?.url) ?? safeImageUrl(activeSubcategory?.iconImage?.url));
  const headerBannerTitle = showSubcategoryPicker
    ? (activeCategory ? titleCase(activeCategory.name) : 'Services')
    : (activeSubcategory ? titleCase(activeSubcategory.name) : 'Services');
  const showInitialLoader = catalogLoading
    && !catalogError
    && (showSubcategoryPicker ? subcategories.length === 0 : services.length === 0);
  const cardGap = 12;
  const horizontalPadding = 16;
  const serviceCardWidth = Math.max(140, Math.floor((screenWidth - (horizontalPadding * 2) - cardGap) / 2));

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

      {!selectedCity ? (
        <CityAvailabilityNotice cityLabel={resolvedLocation.displayCity} />
      ) : null}

      {showInitialLoader ? (
        <View className="mt-5">
          <LoadingState minHeight={360} message={APP_TEXT.main.bookingFlow.loadingError} />
        </View>
      ) : null}

      {!catalogLoading && catalogError ? (
        <ListErrorState
          containerClassName="mt-6"
          title={catalogError}
          description={APP_TEXT.main.bookingFlow.loadingError}
          actionLabel={APP_TEXT.main.bookingFlow.retry}
          onAction={() => void onRefreshCatalog()}
        />
      ) : null}

      {!catalogLoading && !catalogError && showSubcategoryPicker ? (
        <View className="mt-4 gap-3">
          {subcategories.length === 0 ? (
            <ListEmptyState
              title={APP_TEXT.main.bookingFlow.noSubcategory}
              description="Try another category or refresh."
              icon="grid-outline"
            />
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
                    city: selectedCity,
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
          {services.length === 0 ? (
            <View className="mt-4">
              <ListEmptyState
                title={APP_TEXT.main.bookingFlow.noService}
                description="Pick a different subcategory to continue."
                icon="construct-outline"
              />
            </View>
          ) : (
            <View className="mt-4">
              <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                renderItem={({ item }) => {
                  const selected = Boolean(selectedServiceIds[item.id]);
                  const imageUrl = safeImageUrl(item.mainImage?.url) ?? safeImageUrl(item.iconImage?.url);
                  return (
                    <View style={{ marginBottom: 12 }}>
                      <ServiceHeroCard
                        title={item.name}
                        imageUrl={imageUrl}
                        width={serviceCardWidth}
                        height={176}
                        selected={selected}
                        onPress={() => {
                          toggleService(createBookingFlowService({
                            ...item,
                            category: activeCategory ?? undefined,
                            subCategory: activeSubcategory ?? undefined,
                          }));
                        }}
                      />
                    </View>
                  );
                }}
              />
            </View>
          )}

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
