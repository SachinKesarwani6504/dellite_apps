import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { WorkerBookingRouteMapProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { getRouteBearingDegrees } from '@/utils/live-route';
import { theme, uiColors } from '@/utils/theme';
import type { RouteVehicleMode } from '@/types/live-route';

const ROUTE_MAP_DELTA = 0.04;
const ROUTE_STROKE_WIDTH = 5;
const ROUTE_MAP_HEIGHT = 416;
const VEHICLE_MODE_OPTIONS: Array<{ value: RouteVehicleMode; label: string; iconName: keyof typeof Ionicons.glyphMap }> = [
  { value: 'CAR', label: 'Car', iconName: 'car-sport-outline' },
  { value: 'TWO_WHEELER', label: 'Two Wheeler', iconName: 'bicycle-outline' },
  { value: 'WALK', label: 'Walk', iconName: 'walk-outline' },
];

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
  vehicleMode,
  onVehicleModeChange,
  route,
  isDark,
  loading,
  error,
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

  const renderRouteInfoCard = () => (
    <View className="mb-3 overflow-hidden rounded-2xl border" style={{
      borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
      backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95,
    }}>
      <View className="flex-row items-center justify-between border-b px-4 py-3" style={{
        borderBottomColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40,
      }}>
        <View className="flex-row items-center">
          <View
            className="h-9 w-9 items-center justify-center rounded-full border"
            style={{
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="navigate-outline" size={17} color={theme.colors.primary} />
          </View>
          <Text className="ml-2 text-sm font-extrabold text-baseDark dark:text-white">{APP_TEXT.jobs.routeTitle}</Text>
        </View>
      </View>
      <View className="p-3">
        <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
          <View
            className="flex-row items-center border px-3 py-2.5"
            style={{
              width: '48.5%',
              borderRadius: 12,
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">{route?.etaText ?? 'Calculating ETA'}</Text>
          </View>
          <View
            className="flex-row items-center border px-3 py-2.5"
            style={{
              width: '48.5%',
              borderRadius: 12,
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="git-compare-outline" size={14} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">{route?.distanceText ?? 'Calculating distance'}</Text>
          </View>
        </View>
        <Text className="mt-3 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          Select vehicle mode
        </Text>
        <View className="mt-2 flex-row" style={{ gap: 8 }}>
          {VEHICLE_MODE_OPTIONS.map(mode => {
            const selected = vehicleMode === mode.value;
            return (
              <Pressable
                key={mode.value}
                onPress={() => onVehicleModeChange?.(mode.value)}
                className="flex-1 flex-row items-center justify-center rounded-full border px-2 py-2"
                style={{
                  borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight),
                  backgroundColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95),
                }}
              >
                <Ionicons
                  name={mode.iconName}
                  size={12}
                  color={selected ? theme.colors.onPrimary : theme.colors.primary}
                />
                <Text
                  className="ml-1 text-[11px] font-extrabold"
                  style={{ color: selected ? theme.colors.onPrimary : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight) }}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {error ? (
        <Text className="px-3 pb-3 text-xs font-semibold" style={{ color: theme.colors.negative }}>{error}</Text>
      ) : null}
    </View>
  );

  return (
    <View className="mt-5">
      {renderRouteInfoCard()}
      <View className="overflow-hidden rounded-2xl border" style={{
        height: ROUTE_MAP_HEIGHT,
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
      }}>
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
           {originCoordinates ? (
            <Marker
              coordinate={originCoordinates}
              title="Worker live location"
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View
                style={{
                  position: 'absolute',
                  width: 24,
                  height: 24,
                  borderRadius: 15,
                  backgroundColor: uiColors.live.blue,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ rotate: `${workerHeadingDegrees}deg` }],
                  zIndex: 10,
                  elevation: 10,
                }}
              >
                <MaterialIcons name="navigation" size={17} color={theme.colors.onPrimary} />
              </View>
            </Marker>
          ) : null}

          <Marker coordinate={destinationCoordinates} title="Service address">
            <Ionicons
              name="location-sharp"
              size={34}
              color={theme.colors.primary}
            />
          </Marker>
          {routeCoordinates.length > 1 ? (
            <Polyline
              key={`worker-route-solid-${vehicleMode}`}
              coordinates={routeCoordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={ROUTE_STROKE_WIDTH}
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
    </View>
  );
}
