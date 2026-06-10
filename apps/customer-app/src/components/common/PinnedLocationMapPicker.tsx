import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import type { PinnedLocationMapPickerProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { canRenderNativeMap, getNativeMapProvider } from '@/utils/native-map';
import { theme, uiColors } from '@/utils/theme';

const PINNED_LOCATION_DELTA = 0.006;

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: uiColors.map.geometryDark }] },
  { elementType: 'labels.text.fill', stylers: [{ color: uiColors.map.labelFillDark }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: uiColors.map.geometryDark }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: uiColors.map.roadDark }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: uiColors.map.roadLabelDark }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: uiColors.map.waterDark }] },
];

function toRegion(coordinates: PinnedLocationMapPickerProps['coordinates']): Region {
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    latitudeDelta: PINNED_LOCATION_DELTA,
    longitudeDelta: PINNED_LOCATION_DELTA,
  };
}

export function PinnedLocationMapPicker({
  coordinates,
  addressTitle,
  addressSummary,
  isDark,
  isResolving,
  error,
  mapHeight = 360,
  showAddressPreview = true,
  onRegionChangeComplete,
}: PinnedLocationMapPickerProps) {
  const fallbackSummary = addressSummary.trim().length > 0 ? addressSummary : APP_TEXT.main.bookingFlow.pinLocationEmptyHint;
  const canRenderMap = canRenderNativeMap();

  return (
    <View className="overflow-hidden rounded-lg border" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight }}>
      <View style={{ height: mapHeight }}>
        {canRenderMap ? (
          <>
            <MapView
              provider={getNativeMapProvider()}
              style={{ flex: 1 }}
              initialRegion={toRegion(coordinates)}
              customMapStyle={isDark ? DARK_MAP_STYLE : []}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
              toolbarEnabled={false}
              onRegionChangeComplete={(region) => {
                onRegionChangeComplete({
                  latitude: region.latitude,
                  longitude: region.longitude,
                });
              }}
            />
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <View className="items-center">
                <Ionicons name="location-sharp" size={48} color={theme.colors.primary} style={{ marginBottom: -10 }} />
                <View className="h-2 w-8 rounded-full bg-black/20 mt-1" />
              </View>
            </View>
          </>
        ) : (
          <View
            className="flex-1 items-center justify-center px-6"
            style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95 }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
              <Ionicons name="map-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text className="mt-3 text-center text-base font-extrabold text-baseDark dark:text-white">
              {APP_TEXT.main.bookingFlow.pinLocationMapUnavailableTitle}
            </Text>
            <Text className="mt-1 text-center text-xs leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.main.bookingFlow.pinLocationMapUnavailableSubtitle}
            </Text>
          </View>
        )}
        {isResolving ? (
          <View
            className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-2"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95 }}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">
              {APP_TEXT.main.bookingFlow.pinLocationResolvingLabel}
            </Text>
          </View>
        ) : null}
      </View>
      {showAddressPreview ? (
        <View
          className="px-3 py-3"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
        >
          <Text className="text-sm font-extrabold text-baseDark dark:text-white">{addressTitle}</Text>
          <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {fallbackSummary}
          </Text>
          {error ? (
            <Text className="mt-2 text-xs font-semibold" style={{ color: theme.colors.negative }}>
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
