import { useEffect, useState } from 'react';
import { subscribeWorkerLiveLocation } from '@/lib/firebase';
import type { WorkerLiveLocationState } from '@/types/worker-live-location';

export function useWorkerLiveLocationReader(workerId: string | null | undefined, enabled: boolean) {
  const [state, setState] = useState<WorkerLiveLocationState>({
    location: null,
    loading: Boolean(workerId && enabled),
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ location: null, loading: false, error: null });
      return undefined;
    }

    if (!workerId) {
      setState({ location: null, loading: false, error: null });
      return undefined;
    }

    setState(current => ({
      location: current.location,
      loading: true,
      error: null,
    }));
    const unsubscribe = subscribeWorkerLiveLocation(
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
  }, [enabled, workerId]);

  return state;
}
