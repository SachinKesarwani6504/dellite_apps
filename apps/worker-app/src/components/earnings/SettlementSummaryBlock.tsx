import { View, useColorScheme } from 'react-native';
import { SettlementDayCardLayout } from '@/components/earnings/SettlementDayCardLayout';
import type { SettlementCard } from '@/types/worker-finance';
import { getEarningsCardShadowStyle } from '@/utils/worker-finance';
import { palette, uiColors } from '@/utils/theme';

type SettlementSummaryBlockProps = {
  settlement: SettlementCard;
};

export function SettlementSummaryBlock({ settlement }: SettlementSummaryBlockProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        ...getEarningsCardShadowStyle(isDark),
      }}
    >
      <SettlementDayCardLayout settlement={settlement} showStatus />
    </View>
  );
}
