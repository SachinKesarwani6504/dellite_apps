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
const ROUTE_STROKE_WIDTH = 3;
const ROUTE_MAP_HEIGHT = 320;

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
  destinationCoordinates,
  route,
  isDark,
  loading,
  error,
}: WorkerLiveRouteMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const workerCoordinates = getTrackableWorkerCoordinates(workerLocation);
  const isPreviewWorkerLocation = Boolean(
    workerCoordinates && workerLocation?.heartbeatAt === 0,
  );
  const mapCenter = getWorkerRouteMapCenter(
    destinationCoordinates,
    workerCoordinates,
  );
  const routeCoordinates = useMemo(
    () => (route?.coordinates?.length ? route.coordinates : []),
    [route],
  );
  const routeSummary = [route?.etaText, route?.distanceText]
    .filter(Boolean)
    .join(" . ");
  const vehicleModeLabel = getRouteVehicleModeLabel(workerLocation?.vehicleMode ?? 'UNKNOWN');
  const etaLabel = route?.etaText ?? 'Calculating ETA';

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

  return (
    <View
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark
          ? uiColors.surface.borderNeutralDark
          : uiColors.surface.borderNeutralLight,
      }}
    >
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
              coordinates={routeCoordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={ROUTE_STROKE_WIDTH}
              lineDashPattern={route?.isFallback ? [8, 6] : undefined}
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

      <View
        className="px-4 py-3"
        style={{
          backgroundColor: isDark
            ? uiColors.surface.overlayDark10
            : uiColors.surface.overlayLight95,
        }}
      >
        <Text className="text-sm font-extrabold text-baseDark dark:text-white">
          Worker live route
        </Text>
        <Text
          className="mt-1 text-xs font-bold"
          style={{
            color: isDark
              ? uiColors.text.subtitleDark
              : uiColors.text.subtitleLight,
          }}
        >
          Coming by {vehicleModeLabel} . ETA {etaLabel}
        </Text>
        <Text
          className="mt-1 text-xs"
          style={{
            color: isDark
              ? uiColors.text.subtitleDark
              : uiColors.text.subtitleLight,
          }}
        >
          {routeSummary ||
            (workerCoordinates
              ? isPreviewWorkerLocation
                ? "Previewing route until worker live tracking starts."
                : "Worker location is updating from live tracking."
              : "Waiting for the worker to share live location.")}
        </Text>
        {error ? (
          <Text
            className="mt-2 text-xs font-semibold"
            style={{ color: theme.colors.negative }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
