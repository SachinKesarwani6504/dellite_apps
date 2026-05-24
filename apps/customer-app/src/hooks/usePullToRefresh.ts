import { useCallback, useState } from 'react';

type RefreshTask = () => void | Promise<unknown>;

type UsePullToRefreshInput = RefreshTask | RefreshTask[];

export function usePullToRefresh(refreshActions: UsePullToRefreshInput) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    const actions = Array.isArray(refreshActions) ? refreshActions : [refreshActions];
    const run = async () => {
      await Promise.allSettled(actions.map(action => Promise.resolve().then(action)));
    };
    void run().finally(() => {
      setRefreshing(false);
    });
  }, [refreshActions, refreshing]);

  return {
    refreshing,
    onRefresh,
  };
}

