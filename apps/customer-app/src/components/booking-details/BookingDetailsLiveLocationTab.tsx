import { Text, View, useColorScheme } from 'react-native';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { WorkerLiveRouteMap } from '@/components/common/WorkerLiveRouteMap';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { useBookingLiveRoute } from '@/hooks/useBookingLiveRoute';
import { useWorkerLiveLocationReader } from '@/hooks/useWorkerLiveLocationReader';
import {
  canTrackBookingWorker,
  getBookingMapDestinationCoordinates,
  getBookingWorkerId,
  getTrackableWorkerCoordinates,
} from '@/utils/booking-details';
import { palette, uiColors } from '@/utils/theme';

export function BookingDetailsLiveLocationTab() {
  const isDark = useColorScheme() === 'dark';
  const { details } = useBookingDetailsContext();
  const workerId = getBookingWorkerId(details);
  const destinationCoordinates = getBookingMapDestinationCoordinates(details?.address);
  const canTrackWorker = canTrackBookingWorker(details);
  const workerLiveState = useWorkerLiveLocationReader(workerId, canTrackWorker);
  const workerCoordinates = getTrackableWorkerCoordinates(workerLiveState.location);
  const routeState = useBookingLiveRoute({
    origin: workerCoordinates,
    destination: destinationCoordinates,
    vehicleMode: workerLiveState.location?.vehicleMode ?? 'UNKNOWN',
    enabled: canTrackWorker,
  });

  if (!canTrackWorker) {
    return (
      <View className="mt-5">
        <ListEmptyState
          title="Live location unavailable"
          description="Live worker tracking appears after a worker is assigned and while the booking is still active."
          icon="navigate-outline"
        />
      </View>
    );
  }

  if (!destinationCoordinates) {
    return (
      <View className="mt-5">
        <ListEmptyState
          title="Live location unavailable"
          description="Booking address coordinates are missing, so live route cannot be rendered yet."
          icon="navigate-outline"
        />
      </View>
    );
  }

  return (
    <View className="mt-5">
      <WorkerLiveRouteMap
        workerLocation={workerLiveState.location}
        destinationCoordinates={destinationCoordinates}
        route={routeState.route}
        isDark={isDark}
        loading={workerLiveState.loading || routeState.loading}
        error={routeState.error ?? workerLiveState.error}
      />
      <View
        className="mt-3 rounded-2xl border px-4 py-3"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        }}
      >
        <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          Tracking updates come from worker live location while the assignment remains active.
        </Text>
      </View>
    </View>
  );
}
