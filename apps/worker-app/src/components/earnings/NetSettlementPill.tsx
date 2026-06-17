import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { WorkerEarningsNetSettlementPillProps } from '@/types/worker-finance';
import {
  getWorkerEarningsNetSettlementDirection,
  getWorkerEarningsNetSettlementLabel,
  getWorkerEarningsNetSettlementTone,
} from '@/utils/worker-finance';

export function NetSettlementPill({ settlement, compact = false }: WorkerEarningsNetSettlementPillProps) {
  const isDark = useColorScheme() === 'dark';
  const direction = getWorkerEarningsNetSettlementDirection(settlement);
  const tone = getWorkerEarningsNetSettlementTone(direction, isDark);

  return (
    <View
      className={`flex-row items-center rounded-full ${compact ? 'mt-0 px-2.5 py-1' : 'mt-1 px-3 py-1.5'}`}
      style={{ backgroundColor: tone.backgroundColor }}
    >
      <Ionicons
        name={tone.iconName as keyof typeof Ionicons.glyphMap}
        size={compact ? 11 : 13}
        color={tone.textColor}
        style={{ marginRight: 5 }}
      />
      <Text className={`font-black ${compact ? 'text-[10px]' : 'text-xs'}`} style={{ color: tone.textColor }} numberOfLines={2}>
        {getWorkerEarningsNetSettlementLabel(settlement)}
      </Text>
    </View>
  );
}
