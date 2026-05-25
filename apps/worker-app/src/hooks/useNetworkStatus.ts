import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';

type NetworkStatus = {
  isOffline: boolean;
  initialized: boolean;
  refresh: () => Promise<boolean>;
};

function resolveOfflineState(state: Network.NetworkState | null | undefined) {
  if (!state) return false;
  if (state.isConnected === false) return true;
  if (state.isInternetReachable === false) return true;
  return false;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOffline, setIsOffline] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const nextOfflineState = resolveOfflineState(state);
      setIsOffline(nextOfflineState);
      return nextOfflineState;
    } catch {
      // Ignore transient network-state read failures.
      return true;
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const subscription = Network.addNetworkStateListener((state) => {
      setIsOffline(resolveOfflineState(state));
      setInitialized(true);
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => {
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [refresh]);

  return useMemo(() => ({
    isOffline,
    initialized,
    refresh,
  }), [initialized, isOffline, refresh]);
}
