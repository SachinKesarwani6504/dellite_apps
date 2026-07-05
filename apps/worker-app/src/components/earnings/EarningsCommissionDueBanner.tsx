import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import type { EarningsCommissionDueBannerProps } from '@/types/worker-finance';
import { formatInr, parseAmount } from '@/utils/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';

export function EarningsCommissionDueBanner({ amount, onPress }: EarningsCommissionDueBannerProps) {
  const isDark = useColorScheme() === 'dark';
  if (parseAmount(amount) <= 0) return null;

  return (
    <View
      className="mt-4 rounded-2xl border px-4 py-4"
      style={{
        borderColor: uiColors.status.dangerText,
        backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
      }}
    >
      <View className="flex-row items-start">
        <Ionicons name="alert-circle-outline" size={22} color={uiColors.status.dangerText} />
        <View className="ml-3 flex-1">
          <Text className="text-sm font-extrabold" style={{ color: uiColors.status.dangerText }}>
            {APP_TEXT.earnings.commissionDueBannerTitle}
          </Text>
          <Text className="mt-1 text-xs leading-5" style={{ color: uiColors.status.dangerText }}>
            {APP_TEXT.earnings.commissionDueBannerDescription}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xl font-black" style={{ color: uiColors.status.dangerText }}>
              {formatInr(amount)}
            </Text>
            <Pressable
              onPress={onPress}
              disabled={!onPress}
              className="rounded-xl px-4 py-2.5"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Text className="text-xs font-extrabold uppercase" style={{ color: theme.colors.onPrimary }}>
                {APP_TEXT.earnings.commissionDuePayNowAction}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
