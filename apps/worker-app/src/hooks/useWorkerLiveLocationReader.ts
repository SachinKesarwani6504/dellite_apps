import { useEffect, useState } from 'react';
import { subscribeWorkerLiveLocation } from '@/lib/firebase';
import type { WorkerLiveLocationRecord } from '@/lib/firebase';

type WorkerLiveLocationReaderState = {
  location: WorkerLiveLocationRecord | null;
  loading: boolean;
  error: string | null;
};

export function useWorkerLiveLocationReader(workerId: string | null | undefined, enabled: boolean) {
  const [state, setState] = useState<WorkerLiveLocationReaderState>({
    location: null,
    loading: Boolean(workerId && enabled),
    error: null,
  });

  useEffect(() => {
    if (!enabled || !workerId) {
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
