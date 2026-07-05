import { useEffect, useState } from 'react';
import { isFirebaseConfigured, subscribeWorkerLiveLocation, type WorkerLiveLocationRecord } from '@/lib/firebase';
import { APP_TEXT } from '@/utils/appText';

type WorkerLiveLocationReaderState = {
  location: WorkerLiveLocationRecord | null;
  loading: boolean;
  error: string | null;
};

export function useWorkerLiveLocationReader(
  workerUserId: string | null | undefined,
  workerId: string | null | undefined,
  enabled: boolean,
) {
  const [state, setState] = useState<WorkerLiveLocationReaderState>({
    location: null,
    loading: Boolean(workerUserId && workerId && enabled),
    error: null,
  });

  useEffect(() => {
    if (!enabled || !workerUserId || !workerId) {
      setState({ location: null, loading: false, error: null });
      return undefined;
    }

    if (!isFirebaseConfigured) {
      setState({
        location: null,
        loading: false,
        error: APP_TEXT.jobs.liveLocation.readerUnavailable,
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
