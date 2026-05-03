import { FlatList, RefreshControl, Text, View, useWindowDimensions } from 'react-native';
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
import { useCategoryServicesScreenController } from '@/hooks/useCategoryServicesScreenController';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import type {
  CategoryServicesScreenProps,
} from '@/types/main-screens';
import { HOME_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { getSubcategoryServiceCount } from '@/utils/booking-catalog';
import { safeImageUrl, titleCase } from '@/utils';

export function CategoryServicesScreen({ navigation, route }: CategoryServicesScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const {
    selectedServices,
  } = useBookingFlowContext();
  const {
    isDark,
    selectedCity,
    displayCityLabel,
    showSubcategoryPicker,
    loading,
    error,
    subcategories,
    services,
    selectedServiceIdSet,
    headerBannerImage,
    headerBannerTitle,
    showInitialLoader,
    activeCategoryId,
    refresh,
    pickSubcategory,
    toggleServiceSelection,
  } = useCategoryServicesScreenController({ route });
  const onRefreshCatalog = async () => {
    await refresh();
  };
  const refreshControlProps = useBrandRefreshControl(onRefreshCatalog);
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
        <CityAvailabilityNotice cityLabel={displayCityLabel} />
      ) : null}

      {showInitialLoader ? (
        <View className="mt-5">
          <LoadingState minHeight={360} />
        </View>
      ) : null}

      {!loading && error ? (
        <ListErrorState
          containerClassName="mt-6"
          title={error}
          description={APP_TEXT.main.bookingFlow.loadingError}
          actionLabel={APP_TEXT.main.bookingFlow.retry}
          onAction={() => void refresh()}
        />
      ) : null}

      {!loading && !error && showSubcategoryPicker ? (
        <View className="mt-4 gap-3">
          {subcategories.length === 0 ? (
            <ListEmptyState
              title={APP_TEXT.main.bookingFlow.noSubcategory}
              description="Try another category or refresh."
              icon="grid-outline"
            />
          ) : null}
          {subcategories.map(subcategory => {
            const imageUrl = safeImageUrl(subcategory.cardImage?.url)
              ?? safeImageUrl(subcategory.bannerImage?.url)
              ?? safeImageUrl(subcategory.iconImage?.url)
              ?? safeImageUrl(subcategory.mainImage?.url);
            const serviceCount = getSubcategoryServiceCount(subcategory);
            const label = serviceCount === 1 ? 'service' : 'services';

            return (
              <ServiceSelectionCard
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
                metaText={`${serviceCount.toString()} ${label}`}
                isDark={isDark}
              />
            );
          })}
        </View>
      ) : null}

      {!loading && !error && !showSubcategoryPicker ? (
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
                        imageUrl={imageUrl}
                        width={serviceCardWidth}
                        height={176}
                        selected={selected}
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
                navigation.navigate(HOME_SCREEN.BOOKING_DETAILS);
              }}
            />
          </View>
        </>
      ) : null}
    </GradientScreen>
  );
}
