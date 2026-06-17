import { Pressable, useColorScheme } from 'react-native';
import { SettlementDayCardLayout } from '@/components/earnings/SettlementDayCardLayout';
import type { WorkerEarningsDailySettlementCardProps } from '@/types/worker-finance';
import { getEarningsCardShadowStyle } from '@/utils/worker-finance';
import { palette, uiColors } from '@/utils/theme';

export function DailySettlementCard({ item, onPress }: WorkerEarningsDailySettlementCardProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        ...getEarningsCardShadowStyle(isDark),
      }}
    >
      <SettlementDayCardLayout settlement={item} showStatus />
    </Pressable>
  );
}
