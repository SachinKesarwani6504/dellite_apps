import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { LiveTrackingStatusCard } from '@/components/common/LiveTrackingStatusCard';
import type { WorkerBookingRouteMapProps } from '@/types/component-types';
import { ROUTE_VEHICLE_MODE, WORKER_MOVEMENT_STATUS } from '@/types/live-route';
import { APP_TEXT } from '@/utils/appText';
import { getWorkerLiveTrackingCard } from '@/utils/live-tracking';
import { getRouteBearingDegrees } from '@/utils/live-route';
import { theme, uiColors } from '@/utils/theme';

const ROUTE_MAP_DELTA = 0.04;
const ROUTE_STROKE_WIDTH = 5;
const ROUTE_MAP_HEIGHT = 416;
const MIN_ROUTE_RENDER_DISTANCE_METERS = 10;

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: uiColors.map.geometryDark }] },
  { elementType: 'labels.text.fill', stylers: [{ color: uiColors.map.labelFillDark }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: uiColors.map.geometryDark }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: uiColors.map.roadDark }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: uiColors.map.roadLabelDark }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: uiColors.map.waterDark }] },
];

function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadiusMeters = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export function WorkerBookingRouteMap({
  workerLiveLocation,
  originCoordinates,
  destinationCoordinates,
  vehicleMode,
  route,
  isDark,
  loading,
  error,
  onVehicleModeChange,
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
  const distanceKm = typeof route?.distanceMeters === 'number' && Number.isFinite(route.distanceMeters)
    ? route.distanceMeters / 1000
    : undefined;
  const fallbackDistanceMeters = useMemo(
    () => getDistanceInMeters(
      originCoordinates.latitude,
      originCoordinates.longitude,
      destinationCoordinates.latitude,
      destinationCoordinates.longitude,
    ),
    [
      destinationCoordinates.latitude,
      destinationCoordinates.longitude,
      originCoordinates.latitude,
      originCoordinates.longitude,
    ],
  );
  const effectiveRouteDistanceMeters = typeof route?.distanceMeters === 'number' && Number.isFinite(route.distanceMeters)
    ? route.distanceMeters
    : fallbackDistanceMeters;
  const shouldRenderRoute = routeCoordinates.length > 1
    && effectiveRouteDistanceMeters >= MIN_ROUTE_RENDER_DISTANCE_METERS;
  const liveVehicleMode = workerLiveLocation?.vehicleMode ?? ROUTE_VEHICLE_MODE.UNKNOWN;
  const statusCard = getWorkerLiveTrackingCard({
    isOnline: workerLiveLocation?.isOnline ?? false,
    movementStatus: workerLiveLocation?.movementStatus ?? WORKER_MOVEMENT_STATUS.UNKNOWN,
    vehicleMode: liveVehicleMode,
    distanceKm,
  });
  const workerHeadingDegrees = getRouteBearingDegrees(originCoordinates, destinationCoordinates);
  const fitCoordinates = useMemo(
    () => (routeCoordinates.length > 1 ? routeCoordinates : [originCoordinates, destinationCoordinates]),
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

  const renderVehicleModeSelector = () => (
    <View className="mb-3">
      <Text className="mb-2 text-base font-extrabold text-baseDark dark:text-white">
        {APP_TEXT.jobs.liveLocation.selectorTitle}
      </Text>
      <Text className="mb-3 text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
        {APP_TEXT.jobs.liveLocation.selectorSubtitle}
      </Text>
      <View className="flex-row" style={{ gap: 10 }}>
        {[
          { mode: ROUTE_VEHICLE_MODE.WALK, label: APP_TEXT.jobs.liveLocation.modeWalkLabel, iconName: 'walk-outline' as const },
          { mode: ROUTE_VEHICLE_MODE.TWO_WHEELER, label: APP_TEXT.jobs.liveLocation.modeBikeLabel, iconName: 'motorbike' as const },
          { mode: ROUTE_VEHICLE_MODE.CAR, label: APP_TEXT.jobs.liveLocation.modeCarLabel, iconName: 'car-sport-outline' as const },
        ].map(item => {
          const isSelected = liveVehicleMode === item.mode;
          const iconColor = isSelected ? theme.colors.primary : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight);
          return (
            <Pressable
              key={item.mode}
              className="flex-1 items-center justify-center rounded-2xl border py-3"
              style={{
                borderColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                backgroundColor: isSelected
                  ? (isDark ? 'rgba(34,197,94,0.14)' : 'rgba(34,197,94,0.08)')
                  : (isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95),
              }}
              onPress={() => onVehicleModeChange?.(item.mode)}
            >
              {item.mode === ROUTE_VEHICLE_MODE.TWO_WHEELER ? (
                <MaterialCommunityIcons name="motorbike" size={24} color={iconColor} />
              ) : (
                <Ionicons name={item.iconName as 'walk-outline' | 'car-sport-outline'} size={24} color={iconColor} />
              )}
              <Text className="mt-2 text-base font-bold text-baseDark dark:text-white">{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View className="mt-5">
      <LiveTrackingStatusCard
        card={statusCard}
        isDark={isDark}
        liveBadgeText={APP_TEXT.jobs.liveLocation.liveBadge}
        error={error}
      />
      {renderVehicleModeSelector()}

      <View
        className="overflow-hidden rounded-2xl border"
        style={{
          height: ROUTE_MAP_HEIGHT,
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        }}
      >
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
          <Marker
            coordinate={originCoordinates}
            title={APP_TEXT.jobs.liveLocation.workerMarkerTitle}
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

          <Marker coordinate={destinationCoordinates} title={APP_TEXT.jobs.liveLocation.destinationMarkerTitle}>
            <Ionicons name="location-sharp" size={34} color={theme.colors.primary} />
          </Marker>

          {shouldRenderRoute ? (
            <Polyline
              key={`worker-route-solid-${vehicleMode}`}
              coordinates={routeCoordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={ROUTE_STROKE_WIDTH}
            />
          ) : null}
        </MapView>

        {loading ? (
          <View
            className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-2"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95 }}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">{APP_TEXT.jobs.routeReading}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
