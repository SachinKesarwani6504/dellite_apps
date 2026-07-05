import { View, useColorScheme } from 'react-native';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { WorkerLiveRouteMap } from '@/components/common/WorkerLiveRouteMap';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { useBookingLiveRoute } from '@/hooks/useBookingLiveRoute';
import { useWorkerLiveLocationReader } from '@/hooks/useWorkerLiveLocationReader';
import {
  canTrackBookingWorker,
  getBookingMapDestinationCoordinates,
  getBookingWorkerId,
  getBookingWorkerUserId,
  getTrackableWorkerCoordinates,
} from '@/utils/booking-details';

export function BookingDetailsLiveLocationTab() {
  const isDark = useColorScheme() === 'dark';
  const { details } = useBookingDetailsContext();
  const workerId = getBookingWorkerId(details);
  const workerUserId = getBookingWorkerUserId(details);
  const destinationCoordinates = getBookingMapDestinationCoordinates(details?.address);
  const canTrackWorker = canTrackBookingWorker(details);
  const workerLiveState = useWorkerLiveLocationReader(workerUserId, workerId, canTrackWorker);
  const workerCoordinates = getTrackableWorkerCoordinates(workerLiveState.location);
  const routeState = useBookingLiveRoute({
    origin: workerCoordinates,
    destination: destinationCoordinates,
    vehicleMode: workerLiveState.location?.vehicleMode ?? 'UNKNOWN',
    enabled: canTrackWorker,
  });
  const vehicleMode = workerLiveState.location?.vehicleMode ?? 'UNKNOWN';

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
        vehicleMode={vehicleMode}
        destinationCoordinates={destinationCoordinates}
        route={routeState.route}
        isDark={isDark}
        loading={workerLiveState.loading || routeState.loading}
        error={routeState.error ?? workerLiveState.error}
      />
    </View>
  );
}
