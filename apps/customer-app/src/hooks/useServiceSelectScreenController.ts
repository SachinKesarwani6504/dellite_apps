import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { customerActions } from '@/actions';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import { APP_BANNER_PLACEMENT_KEY, type AppBannerItem } from '@/types/app-banner';
import type { CustomerBookableService, CustomerCatalogSubcategory, CustomerHomeCategory, CustomerImageUsageType } from '@/types/customer';
import { APP_TEXT } from '@/utils/appText';
import { createBookingFlowService, getErrorMessage, safeImageUrl, titleCase } from '@/utils';

const CATALOG_USAGE_TYPES: CustomerImageUsageType[] = ['MAIN', 'ICON'];

function toBookableServices(source?: CustomerCatalogSubcategory | null): CustomerBookableService[] {
  if (!Array.isArray(source?.services)) return [];
  return source.services as CustomerBookableService[];
}

type UseServiceSelectScreenControllerArgs = {
  categoryId?: string;
  subcategoryId?: string;
  serviceId?: string;
  city?: string;
};

export function useServiceSelectScreenController(args: UseServiceSelectScreenControllerArgs) {
  const isDark = useColorScheme() === 'dark';
  const { locationState } = useAuthContext();
  const { selectedServices, setCategory, setSubcategory, toggleService } = useBookingFlowContext();
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
  const [activeSubcategory, setActiveSubcategory] = useState<CustomerCatalogSubcategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<AppBannerItem[]>([]);
  const selectedServiceIdSetRef = useRef<Set<string>>(new Set());
  const initialServiceAppliedRef = useRef(false);

  useEffect(() => {
    selectedServiceIdSetRef.current = new Set(selectedServices.map(line => line.service.id));
  }, [selectedServices]);

  const refresh = useCallback(async () => {
    if (!selectedCity) return;
    setLoading(true);
    setError(null);
    try {
      let resolvedSubcategoryId = args.subcategoryId?.trim() ?? '';
      let resolvedCategoryId = args.categoryId?.trim() ?? '';
      const seedServiceId = args.serviceId?.trim() ?? '';

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

      const [subcategory, bannerData] = await Promise.all([
        customerActions.getCustomerSubcategoryById(resolvedSubcategoryId, {
          city: selectedCity,
          includeCategory: true,
          includeServices: true,
          includePriceOptions: true,
          includeTask: true,
          includeImage: true,
          usageType: CATALOG_USAGE_TYPES,
        }),
        customerActions.getAppBanners({
          placementKey: APP_BANNER_PLACEMENT_KEY.SERVICE_SELECT,
          city: selectedCity,
          subcategoryId: resolvedSubcategoryId,
        }),
      ]);

      const maybeCategory = (subcategory as unknown as { category?: CustomerHomeCategory }).category;
      if (resolvedCategoryId) {
        setCategory({ id: resolvedCategoryId, name: maybeCategory?.name ?? null });
      }
      setSubcategory({ id: subcategory.id, name: subcategory.name });
      setActiveSubcategory(subcategory);
      if (maybeCategory) setActiveCategory(maybeCategory);
      setBanners(Array.isArray(bannerData) ? bannerData : []);

      if (seedServiceId && !initialServiceAppliedRef.current) {
        if (selectedServiceIdSetRef.current.has(seedServiceId)) {
          initialServiceAppliedRef.current = true;
        } else {
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
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, APP_TEXT.main.bookingFlow.loadingError));
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [args.categoryId, args.serviceId, args.subcategoryId, selectedCity, setCategory, setSubcategory, toggleService]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const services = useMemo(() => toBookableServices(activeSubcategory), [activeSubcategory]);
  const selectedServiceIdSet = useMemo(() => new Set(selectedServices.map(line => line.service.id)), [selectedServices]);
  const showInitialLoader = loading && !error && services.length === 0;
  const headerBannerImage = safeImageUrl(activeSubcategory?.bannerImage?.url)
    ?? safeImageUrl(activeSubcategory?.cardImage?.url)
    ?? safeImageUrl(activeSubcategory?.iconImage?.url)
    ?? safeImageUrl(activeSubcategory?.mainImage?.url);
  const headerBannerTitle = activeSubcategory ? titleCase(activeSubcategory.name) : 'Services';

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
    loading,
    error,
    services,
    selectedServiceIdSet,
    headerBannerImage,
    headerBannerTitle,
    showInitialLoader,
    banners,
    refresh,
    toggleServiceSelection,
  };
}
