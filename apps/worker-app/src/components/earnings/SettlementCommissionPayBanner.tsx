import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import type { SettlementCommissionPayBannerProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { formatInr, parseAmount } from '@/utils/worker-finance';
import { theme, uiColors } from '@/utils/theme';

export function SettlementCommissionPayBanner({
  amount,
  onPress,
  isBusy = false,
}: SettlementCommissionPayBannerProps) {
  const isDark = useColorScheme() === 'dark';
  if (parseAmount(amount) <= 0) return null;

  return (
    <View
      className="rounded-2xl border px-4 py-4"
      style={{
        borderColor: uiColors.status.dangerText,
        backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
      }}
    >
      <Text className="text-sm font-extrabold" style={{ color: uiColors.status.dangerText }}>
        {APP_TEXT.earnings.commissionDueBannerTitle}
      </Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-xl font-black" style={{ color: uiColors.status.dangerText }}>
          {formatInr(amount)}
        </Text>
        {onPress ? (
          <Pressable
            onPress={onPress}
            disabled={isBusy}
            className="rounded-xl px-4 py-2.5"
            style={{ backgroundColor: theme.colors.primary, opacity: isBusy ? 0.7 : 1 }}
          >
            <View className="flex-row items-center gap-2">
              {isBusy ? <ActivityIndicator color={theme.colors.onPrimary} size="small" /> : null}
              <Text className="text-xs font-extrabold uppercase" style={{ color: theme.colors.onPrimary }}>
                {APP_TEXT.earnings.settlementPayCommissionAction}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
