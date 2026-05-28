import { FlatList, RefreshControl, View, useWindowDimensions } from 'react-native';
import { Button } from '@/components/common/Button';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { CityAvailabilityNotice } from '@/components/common/CityAvailabilityNotice';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ImageOverlayBannerCarousel } from '@/components/common/ImageOverlayBannerCarousel';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ServiceHeroCard } from '@/components/common/ServiceHeroCard';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useServiceSelectScreenController } from '@/hooks/useServiceSelectScreenController';
import { APP_TEXT } from '@/utils/appText';
import { handleBannerAction } from '@/utils/banner-navigation';
import { getServiceCardPriceTypeLabel, getServiceCardPricingLabel, safeImageUrl } from '@/utils';
import { HOME_SCREEN } from '@/types/screen-names';
import type { CategoryServicesScreenProps } from '@/types/main-screens';

export function ServiceSelectScreen({ navigation, route }: CategoryServicesScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const { selectedServices } = useBookingFlowContext();
  const {
    selectedCity,
    displayCityLabel,
    error,
    services,
    selectedServiceIdSet,
    banners,
    showInitialLoader,
    refresh,
    toggleServiceSelection,
  } = useServiceSelectScreenController({
    categoryId: route.params.categoryId,
    subcategoryId: route.params.subcategoryId,
    serviceId: route.params.serviceId,
    city: route.params.city,
  });

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await refresh();
  });

  const cardGap = 12;
  const horizontalPadding = 16;
  const serviceCardWidth = Math.max(140, Math.floor((screenWidth - (horizontalPadding * 2) - cardGap) / 2));

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
            keyExtractor={(item, index) => `${item.id}-${index}`}
            numColumns={2}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => {
              const selected = selectedServiceIdSet.has(item.id);
              const imageUrl = safeImageUrl(item.cardImage?.url)
                ?? safeImageUrl(item.bannerImage?.url)
                ?? safeImageUrl(item.iconImage?.url)
                ?? safeImageUrl(item.mainImage?.url);
              return (
                <View style={{ marginBottom: 12 }}>
                  <ServiceHeroCard
                    title={item.name}
                    subtitle={getServiceCardPricingLabel(item)}
                    topRightPillLabel={getServiceCardPriceTypeLabel(item)}
                    imageUrl={imageUrl}
                    width={serviceCardWidth}
                    height={176}
                    selected={selected}
                    selectedIndicatorPosition="top-left"
                    onPress={() => {
                      toggleServiceSelection(item);
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
            navigation.navigate(HOME_SCREEN.BOOKING_DRAFT_DETAILS);
          }}
        />
      </View>
    </>
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
