import { useEffect, useState } from 'react';
import { isFirebaseConfigured, subscribeWorkerLiveLocation } from '@/lib/firebase';
import type { WorkerLiveLocationState } from '@/types/worker-live-location';
import { APP_TEXT } from '@/utils/appText';

export function useWorkerLiveLocationReader(
  workerUserId: string | null | undefined,
  workerId: string | null | undefined,
  enabled: boolean,
) {
  const [state, setState] = useState<WorkerLiveLocationState>({
    location: null,
    loading: Boolean(workerUserId && workerId && enabled),
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ location: null, loading: false, error: null });
      return undefined;
    }

    if (!workerUserId || !workerId) {
      setState({ location: null, loading: false, error: null });
      return undefined;
    }

    if (!isFirebaseConfigured) {
      setState({
        location: null,
        loading: false,
        error: APP_TEXT.main.bookings.liveLocation.readerUnavailable,
      });
      return undefined;
    }

    setState(current => ({
      location: current.location,
      loading: true,
      error: null,
    }));
    const unsubscribe = subscribeWorkerLiveLocation(
      workerUserId,
      workerId,
      location => {
        setState({
          location: location ?? null,
          loading: false,
          error: null,
        });
      },
      error => {
        setState({
          location: null,
          loading: false,
          error: error.message || 'Unable to read worker live location.',
        });
      },
    );

    return unsubscribe;
  }, [enabled, workerId, workerUserId]);

  return state;
}
