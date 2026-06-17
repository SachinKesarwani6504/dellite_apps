import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { SettlementNetSettlement } from '@/types/worker-finance';
import {
  formatNetSettlementCardLabel,
  getWorkerEarningsNetSettlementDirection,
  getWorkerEarningsNetSettlementTone,
} from '@/utils/worker-finance';
import { theme } from '@/utils/theme';

type SettlementCardNetBadgeProps = {
  settlement: SettlementNetSettlement;
};

export function SettlementCardNetBadge({ settlement }: SettlementCardNetBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const direction = getWorkerEarningsNetSettlementDirection(settlement);
  const tone = getWorkerEarningsNetSettlementTone(direction, isDark);

  return (
    <View
      className="mt-1 flex-row items-center rounded-full px-2 py-1"
      style={{ backgroundColor: tone.backgroundColor }}
    >
      <View
        className="mr-1.5 h-5 w-5 items-center justify-center rounded-full"
        style={{ backgroundColor: tone.textColor }}
      >
        <Ionicons
          name={tone.iconName as keyof typeof Ionicons.glyphMap}
          size={11}
          color={theme.colors.onPrimary}
        />
      </View>
      <Text className="flex-shrink text-[10px] font-extrabold leading-4" style={{ color: tone.textColor }} numberOfLines={2}>
        {formatNetSettlementCardLabel(settlement)}
      </Text>
    </View>
  );
}
