import { useEffect, useMemo, useRef } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWorkerLiveLocation } from '@/hooks/useWorkerLiveLocation';
import { resolveWorkerIdFromAuthUser } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

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
    activeBookingId,
    lastLocation,
    error,
    goOnline,
  } = useWorkerLiveLocation({ workerId: resolvedWorkerId });

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
        <Text className="mt-2 text-sm text-baseDark dark:text-white">
          Active Booking: {activeBookingId ?? APP_TEXT.home.liveTracking.bookingPlaceholder}
        </Text>
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
