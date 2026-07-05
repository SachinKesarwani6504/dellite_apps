import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { SettlementCommissionDueSummaryCardProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import {
  formatInr,
  getEarningsCardShadowStyle,
  hasNonZeroFinanceAmount,
} from '@/utils/worker-finance';
import { palette, uiColors } from '@/utils/theme';

type SummaryRowProps = {
  label: string;
  amount: string;
  emphasized?: boolean;
};

function SummaryRow({ label, amount, emphasized = false }: SummaryRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm" style={{ color: mutedTextColor }}>
        {label}
      </Text>
      <Text
        className={emphasized ? 'text-base font-extrabold text-baseDark dark:text-white' : 'text-sm font-bold text-baseDark dark:text-white'}
        style={emphasized ? { color: uiColors.status.dangerText } : undefined}
      >
        {amount}
      </Text>
    </View>
  );
}

export function SettlementCommissionDueSummaryCard({
  netSettlement,
  carriedForwardDueAmount,
  commissionRecoveredAmount,
}: SettlementCommissionDueSummaryCardProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View
      className="overflow-hidden rounded-2xl border px-4 py-4"
      style={{
        borderColor: uiColors.status.dangerText,
        backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
        ...getEarningsCardShadowStyle(isDark),
      }}
    >
      <View className="flex-row items-center">
        <Ionicons name="alert-circle-outline" size={18} color={uiColors.status.dangerText} />
        <Text className="ml-2 text-base font-extrabold" style={{ color: uiColors.status.dangerText }}>
          {APP_TEXT.earnings.commissionDueSummaryTitle}
        </Text>
      </View>
      {netSettlement.displayText ? (
        <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
          {netSettlement.displayText}
        </Text>
      ) : null}

      <View className="mt-3">
        <SummaryRow
          label={netSettlement.label || APP_TEXT.earnings.dueLabel}
          amount={formatInr(netSettlement.amount)}
          emphasized
        />
        {hasNonZeroFinanceAmount(carriedForwardDueAmount) ? (
          <SummaryRow
            label={APP_TEXT.earnings.carriedForwardDueLabel}
            amount={formatInr(carriedForwardDueAmount)}
          />
        ) : null}
        {hasNonZeroFinanceAmount(commissionRecoveredAmount) ? (
          <SummaryRow
            label={APP_TEXT.earnings.commissionRecoveredLabel}
            amount={formatInr(commissionRecoveredAmount)}
          />
        ) : null}
      </View>
    </View>
  );
}
