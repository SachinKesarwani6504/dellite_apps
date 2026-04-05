import { useMemo } from 'react';
import { Platform, RefreshControlProps, useColorScheme } from 'react-native';
import { uiColors } from '@/utils/theme';

type BrandRefreshControlStyleProps = Pick<
  RefreshControlProps,
  'tintColor' | 'colors' | 'progressBackgroundColor'
>;

type BrandRefreshControlConfig = {
  modeKey: 'dark' | 'light';
  refreshProps: BrandRefreshControlStyleProps;
};

export function useBrandRefreshControlProps(): BrandRefreshControlConfig {
  const modeKey = useColorScheme() === 'dark' ? 'dark' : 'light';
  const spinnerColor = modeKey === 'dark' ? uiColors.refresh.darkSpinner : uiColors.refresh.lightSpinner;
  const progressBackgroundColor = modeKey === 'dark' ? uiColors.refresh.darkTrack : uiColors.refresh.lightTrack;

  return useMemo(
    () => ({
      modeKey,
      refreshProps: {
        tintColor: spinnerColor,
        colors: [spinnerColor],
        ...(Platform.OS === 'android' ? { progressBackgroundColor } : {}),
      },
    }),
    [modeKey, spinnerColor, progressBackgroundColor],
  );
}
