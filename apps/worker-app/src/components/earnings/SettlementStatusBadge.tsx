import { Text, View, useColorScheme } from 'react-native';
import type { SettlementStatusBadgeProps } from '@/types/worker-finance';
import { getSettlementStatusLabel, getSettlementStatusTone } from '@/utils/worker-finance';

export function SettlementStatusBadge({ status }: SettlementStatusBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const tone = getSettlementStatusTone(status, isDark);

  return (
    <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: tone.backgroundColor }}>
      <Text className="text-xs font-extrabold" style={{ color: tone.textColor }}>
        {getSettlementStatusLabel(status)}
      </Text>
    </View>
  );
}
