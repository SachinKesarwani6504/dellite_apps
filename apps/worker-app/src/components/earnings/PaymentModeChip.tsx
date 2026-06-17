import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { WorkerEarningsPaymentModeChipProps } from '@/types/worker-finance';
import { getWorkerEarningsPaymentModeTone } from '@/utils/worker-finance';

export function PaymentModeChip({ tone, label, count }: WorkerEarningsPaymentModeChipProps) {
  const isDark = useColorScheme() === 'dark';
  const toneStyle = getWorkerEarningsPaymentModeTone(tone, isDark);

  return (
    <View
      className="flex-row items-center rounded-full border px-2.5 py-1"
      style={{
        backgroundColor: toneStyle.backgroundColor,
        borderColor: toneStyle.borderColor,
      }}
    >
      <Ionicons
        name={toneStyle.iconName as keyof typeof Ionicons.glyphMap}
        size={12}
        color={toneStyle.textColor}
        style={{ marginRight: 4 }}
      />
      <Text className="text-[11px] font-extrabold" style={{ color: toneStyle.textColor }}>
        {`${label} ${count}`}
      </Text>
    </View>
  );
}
