import { useCallback, useState } from 'react';
import { useColorScheme } from 'react-native';

import { uiColors } from '@/utils/theme';

export function useBrandRefreshControl(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const isDark = useColorScheme() === 'dark';

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  return {
    refreshing,
    onRefresh: refresh,
    tintColor: isDark ? uiColors.refresh.darkSpinner : uiColors.refresh.lightSpinner,
    colors: [isDark ? uiColors.refresh.darkSpinner : uiColors.refresh.lightSpinner],
    progressBackgroundColor: isDark ? uiColors.refresh.darkTrack : uiColors.refresh.lightTrack,
  };
}
