import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { customerActions } from '@/actions';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import type {
  CategoryCatalogUsageTypes,
  CategoryServicesScreenControllerArgs,
  CategoryServicesScreenControllerValue,
} from '@/types/main-screens';
import type {
  CustomerBookableService,
  CustomerCatalogSubcategory,
  CustomerHomeCategory,
} from '@/types/customer';
import { HOME_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { createBookingFlowService, safeImageUrl, titleCase } from '@/utils';

const CATALOG_USAGE_TYPES: CategoryCatalogUsageTypes = ['MAIN', 'ICON'];

function toBookableServices(source?: CustomerCatalogSubcategory | null): CustomerBookableService[] {
  if (!Array.isArray(source?.services)) return [];
  return source.services as CustomerBookableService[];
}

export function useCategoryServicesScreenController(
  args: CategoryServicesScreenControllerArgs,
): CategoryServicesScreenControllerValue {
  const isDark = useColorScheme() === 'dark';
  const { route } = args;
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
    setCategory,
    setSubcategory,
    selectedServices,
    clearSubcategorySelection,
    toggleService,
  } = useBookingFlowContext();
  const [activeCategory, setActiveCategory] = useState<CustomerHomeCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<CustomerCatalogSubcategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialServiceAppliedRef = useRef(false);
  const selectedCity = route.params.city ?? resolvedLocation.serviceableCity ?? '';
  const showSubcategoryPicker = route.name === HOME_SCREEN.CATEGORY_SUBCATEGORIES;

  useFocusEffect(
    useCallback(() => {
      if (!showSubcategoryPicker) return;
      clearSubcategorySelection();
    }, [clearSubcategorySelection, showSubcategoryPicker]),
  );

  const loadScreenData = useCallback(async () => {
    if (!selectedCity) return;
    setLoading(true);
    setError(null);
    try {
      if (showSubcategoryPicker) {
        const categoryId = route.params.categoryId?.trim();
        if (!categoryId) {
          throw new Error('Category is required to load subcategories.');
        }
        const category = await customerActions.getCustomerCategoryById(categoryId, {
          city: selectedCity,
          includeSubcategory: true,
          includeServices: false,
          includeImage: true,
          usageType: CATALOG_USAGE_TYPES,
        });
        setActiveCategory(category);
        setActiveSubcategory(null);
        setCategory({ id: category.id, name: category.name });
        return;
      }

      let resolvedSubcategoryId = route.params.subcategoryId?.trim() ?? '';
      let resolvedCategoryId = route.params.categoryId?.trim() ?? '';
      const seedServiceId = route.params.serviceId?.trim() ?? '';

      if (!resolvedSubcategoryId && seedServiceId) {
        const service = await customerActions.getCustomerServiceById(seedServiceId, {
          city: selectedCity,
          includeCategory: true,
          includeSubcategory: true,
          includePriceOptions: true,
          includeTask: true,
          includeImage: true,
          usageType: CATALOG_USAGE_TYPES,
        });
        resolvedSubcategoryId = service.subCategory?.id?.trim() ?? '';
        resolvedCategoryId = service.category?.id?.trim() ?? resolvedCategoryId;
      }

      if (!resolvedSubcategoryId) {
        throw new Error('Subcategory is required to load services.');
      }

      const subcategory = await customerActions.getCustomerSubcategoryById(resolvedSubcategoryId, {
        city: selectedCity,
        includeCategory: true,
        includeServices: true,
        includePriceOptions: true,
        includeTask: true,
        includeImage: true,
        usageType: CATALOG_USAGE_TYPES,
      });

      const maybeCategory = (subcategory as unknown as { category?: CustomerHomeCategory }).category;
      if (resolvedCategoryId) {
        setCategory({ id: resolvedCategoryId, name: maybeCategory?.name ?? null });
      }
      setSubcategory({ id: subcategory.id, name: subcategory.name });
      setActiveSubcategory(subcategory);

      if (maybeCategory) {
        setActiveCategory(maybeCategory);
      }

      if (seedServiceId && !initialServiceAppliedRef.current) {
        const initialService = toBookableServices(subcategory).find(service => service.id === seedServiceId);
        if (initialService) {
          toggleService(createBookingFlowService({
            ...initialService,
            category: maybeCategory ?? undefined,
            subCategory: subcategory,
          }));
          initialServiceAppliedRef.current = true;
        }
      }
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message.trim()) {
        setError(loadError.message);
      } else {
        setError(APP_TEXT.main.bookingFlow.loadingError);
      }
    } finally {
      setLoading(false);
    }
  }, [
    route.params.categoryId,
    route.params.serviceId,
    route.params.subcategoryId,
    selectedCity,
    setCategory,
    setSubcategory,
    showSubcategoryPicker,
    toggleService,
  ]);

  const refresh = useCallback(async () => {
    await loadScreenData();
  }, [loadScreenData]);

  useEffect(() => {
    void loadScreenData();
  }, [loadScreenData]);

  const subcategories = useMemo(
    () => (Array.isArray(activeCategory?.subcategories) ? activeCategory.subcategories : []),
    [activeCategory],
  );
  const services = useMemo(() => toBookableServices(activeSubcategory), [activeSubcategory]);
  const selectedServiceIdSet = useMemo(
    () => new Set(selectedServices.map(line => line.service.id)),
    [selectedServices],
  );

  const headerBannerImage = showSubcategoryPicker
    ? (safeImageUrl(activeCategory?.bannerImage?.url)
      ?? safeImageUrl(activeCategory?.cardImage?.url)
      ?? safeImageUrl(activeCategory?.iconImage?.url)
      ?? safeImageUrl(activeCategory?.mainImage?.url))
    : (safeImageUrl(activeSubcategory?.bannerImage?.url)
      ?? safeImageUrl(activeSubcategory?.cardImage?.url)
      ?? safeImageUrl(activeSubcategory?.iconImage?.url)
      ?? safeImageUrl(activeSubcategory?.mainImage?.url));
  const headerBannerTitle = showSubcategoryPicker
    ? (activeCategory ? titleCase(activeCategory.name) : 'Services')
    : (activeSubcategory ? titleCase(activeSubcategory.name) : 'Services');
  const showInitialLoader = loading && !error && (showSubcategoryPicker ? subcategories.length === 0 : services.length === 0);

  const pickSubcategory = (subcategory: CustomerCatalogSubcategory) => {
    setSubcategory({ id: subcategory.id, name: subcategory.name });
  };

  const toggleServiceSelection = (service: CustomerBookableService) => {
    toggleService(createBookingFlowService({
      ...service,
      category: activeCategory ?? undefined,
      subCategory: activeSubcategory ?? undefined,
    }));
  };

  return {
    isDark,
    selectedCity,
    displayCityLabel: resolvedLocation.displayCity,
    showSubcategoryPicker,
    loading,
    error,
    subcategories,
    services,
    selectedServiceIdSet,
    headerBannerImage,
    headerBannerTitle,
    showInitialLoader,
    activeCategoryId: activeCategory?.id ?? null,
    activeSubcategory,
    refresh,
    pickSubcategory,
    toggleServiceSelection,
  };
}
