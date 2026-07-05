import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { LiveTrackingStatusCard } from '@/components/common/LiveTrackingStatusCard';
import type { WorkerLiveRouteMapProps } from '@/types/component-types';
import { ROUTE_VEHICLE_MODE, WORKER_MOVEMENT_STATUS } from '@/types/live-route';
import { APP_TEXT } from '@/utils/appText';
import { getTrackableWorkerCoordinates, getWorkerRouteMapCenter } from '@/utils/booking-details';
import { getCustomerLiveTrackingCard } from '@/utils/live-tracking';
import { getRouteBearingDegrees } from '@/utils/live-route';
import { canRenderNativeMap, getNativeMapProvider } from '@/utils/native-map';
import { theme, uiColors } from '@/utils/theme';

const ROUTE_MAP_DELTA = 0.04;
const ROUTE_MAP_HEIGHT = 416;
const MIN_ROUTE_RENDER_DISTANCE_METERS = 10;
const DELLITE_ORANGE = '#FF7A00';
const MAIN_ROUTE_STROKE_WIDTH = 7;
const MAIN_ROUTE_SHADOW_STROKE_WIDTH = 11;
const FINAL_APPROACH_STROKE_WIDTH = 4;
const FINAL_APPROACH_THRESHOLD_METERS = 30;
const FINAL_APPROACH_DASH_PATTERN = [8, 8] as const;

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

export function WorkerLiveRouteMap({
  workerLocation,
  vehicleMode,
  destinationCoordinates,
  route,
  isDark,
  loading,
  error,
}: WorkerLiveRouteMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const workerCoordinates = getTrackableWorkerCoordinates(workerLocation);
  const mapCenter = getWorkerRouteMapCenter(destinationCoordinates, workerCoordinates);
  const routeCoordinates = useMemo(
    () => (route?.coordinates?.length ? route.coordinates : []),
    [route],
  );
  const arrivalMinutes = typeof route?.durationSeconds === 'number' && Number.isFinite(route.durationSeconds)
    ? Math.max(1, Math.round(route.durationSeconds / 60))
    : undefined;
  const distanceKm = typeof route?.distanceMeters === 'number' && Number.isFinite(route.distanceMeters)
    ? route.distanceMeters / 1000
    : undefined;
  const fallbackDistanceMeters = useMemo(
    () => (workerCoordinates
      ? getDistanceInMeters(
          workerCoordinates.latitude,
          workerCoordinates.longitude,
          destinationCoordinates.latitude,
          destinationCoordinates.longitude,
        )
      : Number.POSITIVE_INFINITY),
    [
      destinationCoordinates.latitude,
      destinationCoordinates.longitude,
      workerCoordinates?.latitude,
      workerCoordinates?.longitude,
    ],
  );
  const effectiveRouteDistanceMeters = typeof route?.distanceMeters === 'number' && Number.isFinite(route.distanceMeters)
    ? route.distanceMeters
    : fallbackDistanceMeters;
  const shouldRenderRoute = routeCoordinates.length > 1
    && effectiveRouteDistanceMeters >= MIN_ROUTE_RENDER_DISTANCE_METERS;
  const routeEndPoint = shouldRenderRoute ? routeCoordinates[routeCoordinates.length - 1] : null;
  const finalApproachDistanceMeters = routeEndPoint
    ? getDistanceInMeters(
        routeEndPoint.latitude,
        routeEndPoint.longitude,
        destinationCoordinates.latitude,
        destinationCoordinates.longitude,
      )
    : 0;
  const shouldShowFinalApproach = Boolean(routeEndPoint)
    && finalApproachDistanceMeters > FINAL_APPROACH_THRESHOLD_METERS;
  const liveVehicleMode = workerLocation?.vehicleMode ?? vehicleMode ?? ROUTE_VEHICLE_MODE.UNKNOWN;
  const statusCard = getCustomerLiveTrackingCard({
    isOnline: workerLocation?.isOnline ?? false,
    movementStatus: workerLocation?.movementStatus ?? WORKER_MOVEMENT_STATUS.UNKNOWN,
    vehicleMode: liveVehicleMode,
    arrivalMinutes,
    distanceKm,
  });
  const canRenderMap = canRenderNativeMap();

  const workerHeadingDegrees = typeof workerLocation?.heading === 'number' && Number.isFinite(workerLocation.heading)
    ? workerLocation.heading
    : (workerCoordinates ? getRouteBearingDegrees(workerCoordinates, destinationCoordinates) : 0);

  const fitCoordinates = useMemo(
    () => (routeCoordinates.length > 1
      ? routeCoordinates
      : [destinationCoordinates, ...(workerCoordinates ? [workerCoordinates] : [])]),
    [
      destinationCoordinates.latitude,
      destinationCoordinates.longitude,
      routeCoordinates,
      workerCoordinates?.latitude,
      workerCoordinates?.longitude,
    ],
  );

  useEffect(() => {
    if (fitCoordinates.length < 2) return;
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
    <View>
      <LiveTrackingStatusCard
        card={statusCard}
        isDark={isDark}
        liveBadgeText={APP_TEXT.main.bookings.liveLocation.liveBadge}
        error={error}
      />

      <View
        className="overflow-hidden rounded-2xl border"
        style={{
          height: ROUTE_MAP_HEIGHT,
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        }}
      >
        {canRenderMap ? (
        <MapView
          ref={mapRef}
          provider={getNativeMapProvider()}
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
          {shouldRenderRoute ? (
            <>
              <Polyline
                key={`customer-route-shadow-${vehicleMode}`}
                coordinates={routeCoordinates}
                strokeColor="rgba(255,255,255,0.85)"
                strokeWidth={MAIN_ROUTE_SHADOW_STROKE_WIDTH}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                key={`customer-route-main-${vehicleMode}`}
                coordinates={routeCoordinates}
                strokeColor={DELLITE_ORANGE}
                strokeWidth={MAIN_ROUTE_STROKE_WIDTH}
                lineCap="round"
                lineJoin="round"
              />
            </>
          ) : null}

          {shouldShowFinalApproach && routeEndPoint ? (
            <Polyline
              key="customer-final-approach"
              coordinates={[routeEndPoint, destinationCoordinates]}
              strokeColor="rgba(255,122,0,0.75)"
              strokeWidth={FINAL_APPROACH_STROKE_WIDTH}
              lineDashPattern={[...FINAL_APPROACH_DASH_PATTERN]}
              lineCap="round"
              lineJoin="round"
            />
          ) : null}

          {workerCoordinates ? (
            <Marker
              coordinate={workerCoordinates}
              title={APP_TEXT.main.bookings.liveLocation.workerMarkerTitle}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
            >
              <View
                collapsable={false}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 15,
                  backgroundColor: uiColors.live.blue,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ rotate: `${workerHeadingDegrees}deg` }],
                }}
              >
                <MaterialIcons name="navigation" size={17} color={theme.colors.onPrimary} />
              </View>
            </Marker>
          ) : null}

          <Marker
            coordinate={destinationCoordinates}
            title={APP_TEXT.main.bookings.liveLocation.destinationMarkerTitle}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View collapsable={false}>
              <Ionicons name="location-sharp" size={34} color={theme.colors.primary} />
            </View>
          </Marker>
        </MapView>
        ) : (
          <View
            className="flex-1 items-center justify-center px-6"
            style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95 }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
              <Ionicons name="map-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text className="mt-3 text-center text-base font-extrabold text-baseDark dark:text-white">
              {APP_TEXT.main.bookings.liveLocation.mapUnavailableTitle}
            </Text>
            <Text className="mt-1 text-center text-xs leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.main.bookings.liveLocation.mapUnavailableSubtitle}
            </Text>
          </View>
        )}

        {loading && canRenderMap ? (
          <View
            className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-2"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95 }}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">
              {APP_TEXT.main.bookings.liveLocation.readingLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
