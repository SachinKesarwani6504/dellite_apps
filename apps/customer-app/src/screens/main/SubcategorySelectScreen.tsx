import { RefreshControl, View } from 'react-native';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { CityAvailabilityNotice } from '@/components/common/CityAvailabilityNotice';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ImageOverlayBannerCarousel } from '@/components/common/ImageOverlayBannerCarousel';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { SubcategorySelectionCard } from '@/components/common/SubcategorySelectionCard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useSubcategorySelectScreenController } from '@/hooks/useSubcategorySelectScreenController';
import { getSubcategoryServiceCount } from '@/utils/booking-catalog';
import { APP_TEXT } from '@/utils/appText';
import { handleBannerAction } from '@/utils/banner-navigation';
import { safeImageUrl, titleCase } from '@/utils';
import { HOME_SCREEN } from '@/types/screen-names';
import type { CategoryServicesScreenProps } from '@/types/main-screens';

export function SubcategorySelectScreen({ navigation, route }: CategoryServicesScreenProps) {
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const {
    selectedCity,
    isDark,
    displayCityLabel,
    error,
    subcategories,
    banners,
    showInitialLoader,
    activeCategoryId,
    refresh,
    pickSubcategory,
  } = useSubcategorySelectScreenController({
    categoryId: route.params.categoryId,
    city: route.params.city,
  });

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refresh();
  });

  const screenContent = !selectedCity ? (
    <CityAvailabilityNotice cityLabel={displayCityLabel} />
  ) : showInitialLoader ? (
    <View className="mt-5">
      <LoadingState minHeight={360} />
    </View>
  ) : error ? (
    <ListErrorState
      containerClassName="mt-6"
      title={error}
      description={APP_TEXT.main.bookingFlow.loadingError}
      actionLabel={APP_TEXT.main.bookingFlow.retry}
      onAction={() => void refresh()}
    />
  ) : (
    <View className="mt-4 gap-3">
      {subcategories.length === 0 ? (
        <ListEmptyState
          title={APP_TEXT.main.bookingFlow.noSubcategory}
          description="Try another category or refresh."
          icon="grid-outline"
        />
      ) : subcategories.map(subcategory => {
        const imageUrl = safeImageUrl(subcategory.cardImage?.url)
          ?? safeImageUrl(subcategory.bannerImage?.url)
          ?? safeImageUrl(subcategory.iconImage?.url)
          ?? safeImageUrl(subcategory.mainImage?.url);
        const serviceCount = getSubcategoryServiceCount(subcategory);
        const serviceLabel = serviceCount === 1 ? 'service' : 'services';

        return (
          <SubcategorySelectionCard
            key={subcategory.id}
            onPress={() => {
              pickSubcategory(subcategory);
              navigation.navigate(HOME_SCREEN.SUBCATEGORY_SERVICES, {
                sourceType: 'category',
                categoryId: activeCategoryId ?? undefined,
                subcategoryId: subcategory.id,
                city: selectedCity,
              });
            }}
            title={titleCase(subcategory.name)}
            description={subcategory.description}
            imageUrl={imageUrl}
            badgeLabel={`${serviceCount.toString()} ${serviceLabel}`}
            isDark={isDark}
          />
        );
      })}
    </View>
  );

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
    >
      <DetailsTopBar onBack={() => navigation.goBack()} />

      {banners.length > 0 ? (
        <ImageOverlayBannerCarousel
          containerClassName="mt-4"
          banners={banners}
          onPressBanner={(banner) => {
            void handleBannerAction({
              action: banner.action,
              navigation,
              city: selectedCity,
            });
          }}
        />
      ) : null}

      {screenContent}
    </GradientScreen>
  );
}
