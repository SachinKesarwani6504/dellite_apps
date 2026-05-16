import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import type { WorkerLiveRouteMapProps } from "@/types/component-types";
import {
  getTrackableWorkerCoordinates,
  getWorkerRouteMapCenter,
} from "@/utils/booking-details";
import { getRouteBearingDegrees, getRouteVehicleModeLabel } from "@/utils/live-route";
import { theme, uiColors } from "@/utils/theme";

const ROUTE_MAP_DELTA = 0.04;
const ROUTE_STROKE_WIDTH = 5;
const ROUTE_MAP_HEIGHT = 416;

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: uiColors.map.geometryDark }] },
  { elementType: "labels.text.fill", stylers: [{ color: uiColors.map.labelFillDark }] },
  { elementType: "labels.text.stroke", stylers: [{ color: uiColors.map.geometryDark }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: uiColors.map.roadDark }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: uiColors.map.roadLabelDark }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: uiColors.map.waterDark }],
  },
];

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
  const mapCenter = getWorkerRouteMapCenter(
    destinationCoordinates,
    workerCoordinates,
  );
  const routeCoordinates = useMemo(
    () => (route?.coordinates?.length ? route.coordinates : []),
    [route],
  );
  const vehicleModeLabel = getRouteVehicleModeLabel(vehicleMode);
  const etaLabel = route?.etaText ?? 'Calculating ETA';
  const distanceLabel = route?.distanceText ?? 'Calculating distance';

  // Extract heading directly from RTDB live location payload, fallback to route bearing
  const workerHeadingDegrees =
    (workerLocation as any)?.heading ??
    (workerCoordinates as any)?.heading ??
    (workerCoordinates
      ? getRouteBearingDegrees(workerCoordinates, destinationCoordinates)
      : 0);

  const fitCoordinates = useMemo(
    () =>
      routeCoordinates.length > 1
        ? routeCoordinates
        : [
            destinationCoordinates,
            ...(workerCoordinates ? [workerCoordinates] : []),
          ],
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

  const renderRouteInfoCard = () => (
    <View className="mb-3 overflow-hidden rounded-2xl border" style={{
      borderColor: isDark
        ? uiColors.surface.borderNeutralDark
        : uiColors.surface.borderNeutralLight,
      backgroundColor: isDark
        ? uiColors.surface.cardMutedDark
        : uiColors.surface.overlayLight95,
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
          <Text className="ml-2 text-sm font-extrabold text-baseDark dark:text-white">
            Worker Live Route
          </Text>
        </View>
      </View>
      <View className="p-3">
        <View className="flex-row justify-between" style={{ gap: 8 }}>
          <View
            className="flex-row items-center border px-3 py-2.5"
            style={{
              width: "31.5%",
              borderRadius: 12,
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="walk-outline" size={14} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">{vehicleModeLabel}</Text>
          </View>
          <View
            className="flex-row items-center border px-3 py-2.5"
            style={{
              width: "31.5%",
              borderRadius: 12,
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">{etaLabel}</Text>
          </View>
          <View
            className="flex-row items-center border px-3 py-2.5"
            style={{
              width: "31.5%",
              borderRadius: 12,
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="git-compare-outline" size={14} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">{distanceLabel}</Text>
          </View>
        </View>
      </View>
      {error ? (
        <Text
          className="px-3 pb-3 text-xs font-semibold"
          style={{ color: theme.colors.negative }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View>
      {renderRouteInfoCard()}
      <View
        className="overflow-hidden rounded-2xl border"
        style={{
          height: ROUTE_MAP_HEIGHT,
          borderColor: isDark
            ? uiColors.surface.borderNeutralDark
            : uiColors.surface.borderNeutralLight,
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
          <Marker coordinate={destinationCoordinates} title="Service address">
            <Ionicons
              name="location-sharp"
              size={34}
              color={theme.colors.primary}
            />
          </Marker>

          {workerCoordinates ? (
            <Marker
              coordinate={workerCoordinates}
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
          {routeCoordinates.length > 1 ? (
            <Polyline
              key={`customer-route-solid-${vehicleMode}`}
              coordinates={routeCoordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={ROUTE_STROKE_WIDTH}
            />
          ) : null}
        </MapView>

        {loading ? (
          <View
            className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-2"
            style={{
              backgroundColor: isDark
                ? uiColors.surface.overlayDark95
                : uiColors.surface.overlayLight95,
            }}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-bold text-baseDark dark:text-white">
              Reading live location
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
