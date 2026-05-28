import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { customerActions } from '@/actions';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import { APP_BANNER_PLACEMENT_KEY, type AppBannerItem } from '@/types/app-banner';
import type { CustomerCatalogSubcategory, CustomerHomeCategory, CustomerImageUsageType } from '@/types/customer';
import { APP_TEXT } from '@/utils/appText';
import { getErrorMessage, safeImageUrl, titleCase } from '@/utils';

const CATALOG_USAGE_TYPES: CustomerImageUsageType[] = ['MAIN', 'ICON'];

type UseSubcategorySelectScreenControllerArgs = {
  categoryId?: string;
  city?: string;
};

export function useSubcategorySelectScreenController(args: UseSubcategorySelectScreenControllerArgs) {
  const isDark = useColorScheme() === 'dark';
  const { locationState } = useAuthContext();
  const { setCategory, setSubcategory } = useBookingFlowContext();

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

  const selectedCity = args.city ?? resolvedLocation.serviceableCity ?? '';
  const [activeCategory, setActiveCategory] = useState<CustomerHomeCategory | null>(null);
  const [banners, setBanners] = useState<AppBannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!selectedCity) return;
    const categoryId = args.categoryId?.trim();
    if (!categoryId) {
      setError('Category is required to load subcategories.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [category, bannerData] = await Promise.all([
        customerActions.getCustomerCategoryById(categoryId, {
          city: selectedCity,
          includeSubcategory: true,
          includeServices: false,
          includeImage: true,
          usageType: CATALOG_USAGE_TYPES,
        }),
        customerActions.getAppBanners({
          placementKey: APP_BANNER_PLACEMENT_KEY.SUBCATEGORY_SELECT,
          city: selectedCity,
          categoryId,
        }),
      ]);
      setActiveCategory(category);
      setCategory({ id: category.id, name: category.name });
      setBanners(Array.isArray(bannerData) ? bannerData : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, APP_TEXT.main.bookingFlow.loadingError));
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [args.categoryId, selectedCity, setCategory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subcategories: CustomerCatalogSubcategory[] = useMemo(
    () => (Array.isArray(activeCategory?.subcategories) ? activeCategory.subcategories : []),
    [activeCategory],
  );

  const pickSubcategory = useCallback((subcategory: CustomerCatalogSubcategory) => {
    setSubcategory({ id: subcategory.id, name: subcategory.name });
  }, [setSubcategory]);

  const headerBannerImage = safeImageUrl(activeCategory?.bannerImage?.url)
    ?? safeImageUrl(activeCategory?.cardImage?.url)
    ?? safeImageUrl(activeCategory?.iconImage?.url)
    ?? safeImageUrl(activeCategory?.mainImage?.url);

  const headerBannerTitle = activeCategory ? titleCase(activeCategory.name) : 'Services';
  const showInitialLoader = loading && !error && subcategories.length === 0;

  return {
    isDark,
    selectedCity,
    displayCityLabel: resolvedLocation.displayCity,
    loading,
    error,
    subcategories,
    banners,
    showInitialLoader,
    activeCategoryId: activeCategory?.id ?? null,
    headerBannerImage,
    headerBannerTitle,
    pickSubcategory,
    refresh,
  };
}
