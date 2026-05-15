import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { BookingLocationPinMarker } from '@/components/common/BookingLocationPinMarker';
import { WorkerLiveMarker } from '@/components/common/WorkerLiveMarker';
import type { WorkerBookingRouteMapProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { getRouteBearingDegrees } from '@/utils/live-route';
import { theme, uiColors } from '@/utils/theme';

const ROUTE_MAP_DELTA = 0.04;
const ROUTE_STROKE_WIDTH = 3;
const ROUTE_MAP_HEIGHT = 320;

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: uiColors.map.geometryDark }] },
  { elementType: 'labels.text.fill', stylers: [{ color: uiColors.map.labelFillDark }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: uiColors.map.geometryDark }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: uiColors.map.roadDark }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: uiColors.map.roadLabelDark }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: uiColors.map.waterDark }] },
];

export function WorkerBookingRouteMap({
  originCoordinates,
  destinationCoordinates,
  route,
  isDark,
  loading,
  error,
  onOpenMaps,
}: WorkerBookingRouteMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const mapCenter = {
    latitude: (originCoordinates.latitude + destinationCoordinates.latitude) / 2,
    longitude: (originCoordinates.longitude + destinationCoordinates.longitude) / 2,
  };
  const routeCoordinates = useMemo(
    () => (route?.coordinates?.length ? route.coordinates : []),
    [route],
  );
  const routeSummary = [route?.etaText, route?.distanceText].filter(Boolean).join(' . ');
  const workerHeadingDegrees = getRouteBearingDegrees(originCoordinates, destinationCoordinates);
  const fitCoordinates = useMemo(
    () => (routeCoordinates.length > 1
      ? routeCoordinates
      : [originCoordinates, destinationCoordinates]),
    [
      destinationCoordinates.latitude,
      destinationCoordinates.longitude,
      originCoordinates.latitude,
      originCoordinates.longitude,
      routeCoordinates,
    ],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      mapRef.current?.fitToCoordinates(fitCoordinates, {
        edgePadding: {
          top: 70,
          right: 50,
          bottom: 70,
          left: 50,
        },
        animated: true,
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [fitCoordinates]);

  return (
    <View className="mt-5 overflow-hidden rounded-2xl border" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight }}>
      <View style={{ height: ROUTE_MAP_HEIGHT }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            ...mapCenter,
            latitudeDelta: ROUTE_MAP_DELTA,
            longitudeDelta: ROUTE_MAP_DELTA,
          }}
          customMapStyle={isDark ? DARK_MAP_STYLE : []}
          showsCompass={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          <Marker coordinate={originCoordinates} title="Your location">
            <WorkerLiveMarker headingDegrees={workerHeadingDegrees} />
          </Marker>

          <Marker coordinate={destinationCoordinates} title="Booking location">
            <BookingLocationPinMarker />
          </Marker>

          {routeCoordinates.length > 1 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={ROUTE_STROKE_WIDTH}
              lineDashPattern={route?.isFallback ? [8, 6] : undefined}
            />
          ) : null}
        </MapView>

        {loading ? (
          <View className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-2" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95 }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">{APP_TEXT.jobs.routeReading}</Text>
          </View>
        ) : null}
      </View>

      <View className="px-4 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}>
        <Text className="text-sm font-extrabold text-baseDark dark:text-white">{APP_TEXT.jobs.routeTitle}</Text>
        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {routeSummary || APP_TEXT.jobs.routeWaiting}
        </Text>
        {error ? (
          <Text className="mt-2 text-xs font-semibold" style={{ color: theme.colors.negative }}>{error}</Text>
        ) : null}
        <Pressable
          onPress={onOpenMaps}
          className="mt-3 flex-row items-center justify-center rounded-xl px-4 py-3"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Ionicons name="navigate-outline" size={16} color={theme.colors.onPrimary} />
          <Text className="ml-2 text-sm font-extrabold" style={{ color: theme.colors.onPrimary }}>
            {APP_TEXT.jobs.openInMaps}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
