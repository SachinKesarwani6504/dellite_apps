import { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWorkerLiveLocation } from '@/hooks/useWorkerLiveLocation';
import type { WorkerVehicleMode } from '@/lib/firebase';
import { resolveWorkerIdFromAuthUser } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

const workerVehicleModeOptions: WorkerVehicleMode[] = ['CAR', 'TWO_WHEELER', 'WALK', 'UNKNOWN'];

export function WorkerHomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user, me, isAuthenticated } = useAuthContext();
  const resolvedWorkerId = useMemo(
    () => resolveWorkerIdFromAuthUser(user, (me as Record<string, unknown> | null | undefined) ?? null),
    [me, user],
  );
  const autoGoOnlineAttemptedRef = useRef(false);

  const {
    isOnline,
    isTracking,
    vehicleMode,
    lastLocation,
    error,
    goOnline,
    updateVehicleMode,
  } = useWorkerLiveLocation({ workerId: resolvedWorkerId });

  const getWorkerVehicleModeLabel = (mode: WorkerVehicleMode) => {
    if (mode === 'CAR') return APP_TEXT.home.liveTracking.vehicleModeCar;
    if (mode === 'TWO_WHEELER') return APP_TEXT.home.liveTracking.vehicleModeTwoWheeler;
    if (mode === 'WALK') return APP_TEXT.home.liveTracking.vehicleModeWalk;
    return APP_TEXT.home.liveTracking.vehicleModeUnknown;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      autoGoOnlineAttemptedRef.current = false;
      return;
    }

    if (!resolvedWorkerId || isOnline || autoGoOnlineAttemptedRef.current) {
      return;
    }

    autoGoOnlineAttemptedRef.current = true;
    void goOnline();
  }, [goOnline, isAuthenticated, isOnline, resolvedWorkerId]);

  return (
    <View
      className="flex-1 px-4 pt-6"
      style={{ backgroundColor: isDark ? palette.dark.background : palette.light.background }}
    >
      <Text className="text-xl font-bold text-baseDark dark:text-white">{APP_TEXT.home.liveTracking.title}</Text>

      <View className="mt-4 rounded-lg border border-white/20 p-4">
        <Text className="text-sm text-baseDark dark:text-white">
          Worker ID: {resolvedWorkerId ?? APP_TEXT.home.liveTracking.unavailableWorkerId}
        </Text>
        <Text className="mt-2 text-sm text-baseDark dark:text-white">
          Status: {isOnline ? APP_TEXT.home.liveTracking.statusOnline : APP_TEXT.home.liveTracking.statusOffline}
        </Text>
        <Text className="mt-2 text-sm text-baseDark dark:text-white">
          Tracking: {isTracking ? APP_TEXT.home.liveTracking.trackingOn : APP_TEXT.home.liveTracking.trackingOff}
        </Text>
        <Text className="mt-4 text-xs font-extrabold uppercase text-baseDark dark:text-white">
          {APP_TEXT.home.liveTracking.vehicleModeTitle}
        </Text>
        <View className="mt-2 flex-row gap-2">
          {workerVehicleModeOptions.map(mode => {
            const selected = mode === vehicleMode;
            return (
              <Pressable
                key={mode}
                onPress={() => void updateVehicleMode(mode)}
                className="flex-1 items-center rounded-full px-3 py-2"
                style={{ backgroundColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20) }}
              >
                <Text className="text-xs font-extrabold" style={{ color: selected ? theme.colors.onPrimary : theme.colors.primary }}>
                  {getWorkerVehicleModeLabel(mode)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="mt-2 text-sm text-baseDark dark:text-white">
          Last Lat: {lastLocation?.lat ?? APP_TEXT.home.liveTracking.unknownCoordinates}
        </Text>
        <Text className="mt-2 text-sm text-baseDark dark:text-white">
          Last Lng: {lastLocation?.lng ?? APP_TEXT.home.liveTracking.unknownCoordinates}
        </Text>
        {error ? (
          <Text className="mt-2 text-sm font-semibold text-red-500">{error}</Text>
        ) : null}
      </View>
    </View>
  );
}
