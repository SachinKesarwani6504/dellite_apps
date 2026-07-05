import { Text, View, useColorScheme } from 'react-native';
import { PaymentModeChip } from '@/components/earnings/PaymentModeChip';
import { SettlementCardHeader } from '@/components/earnings/SettlementCardHeader';
import { SettlementCardNetBadge } from '@/components/earnings/SettlementCardNetBadge';
import type { SettlementDayCardLayoutProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import {
  formatInr,
  getSettlementJobsBadgeLabel,
} from '@/utils/worker-finance';
import { theme, uiColors } from '@/utils/theme';

function SettlementDashedDivider({ vertical = false }: { vertical?: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const color = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;

  if (vertical) {
    return (
      <View
        className="mx-2 self-stretch"
        style={{
          width: 1,
          borderLeftWidth: 1,
          borderStyle: 'dashed',
          borderColor: color,
        }}
      />
    );
  }

  return (
    <View
      className="my-4"
      style={{
        borderTopWidth: 1,
        borderStyle: 'dashed',
        borderColor: color,
      }}
    />
  );
}

function SettlementAmountColumn({
  label,
  amount,
  amountColor,
}: {
  label: string;
  amount: string;
  amountColor?: string;
}) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View className="flex-1">
      <Text className="text-[11px] font-semibold" style={{ color: mutedTextColor }}>
        {label}
      </Text>
      <Text
        className="mt-1 text-base font-extrabold"
        style={{ color: amountColor ?? (isDark ? theme.colors.onPrimary : theme.colors.baseDark) }}
        numberOfLines={1}
      >
        {amount}
      </Text>
    </View>
  );
}

export function SettlementDayCardLayout({ settlement, showStatus = false }: SettlementDayCardLayoutProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const paymentModes = [
    { tone: 'online' as const, label: APP_TEXT.earnings.onlineModeLabel, count: settlement.paymentBreakdown.online.count },
    { tone: 'cash' as const, label: APP_TEXT.earnings.cashModeLabel, count: settlement.paymentBreakdown.cash.count },
    { tone: 'upi' as const, label: APP_TEXT.earnings.upiModeLabel, count: settlement.paymentBreakdown.workerUpi.count },
  ].filter(mode => mode.count > 0);

  return (
    <>
      <SettlementCardHeader
        displayDate={settlement.displayDate}
        status={settlement.status}
        showStatus={showStatus}
      />

      <View className="p-4">
        <View className="flex-row items-center justify-end">
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.cardNeutralLight }}
          >
            <Text className="text-xs font-bold" style={{ color: mutedTextColor }}>
              {getSettlementJobsBadgeLabel(settlement.completedJobs)}
            </Text>
          </View>
        </View>

        {paymentModes.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
            {paymentModes.map(mode => (
              <PaymentModeChip key={mode.tone} tone={mode.tone} label={mode.label} count={mode.count} />
            ))}
          </View>
        ) : null}

        <SettlementDashedDivider />

        <View className="flex-row items-start">
          <SettlementAmountColumn
            label={APP_TEXT.earnings.totalBillLabel}
            amount={formatInr(settlement.totalPayableAmount)}
          />
          <SettlementDashedDivider vertical />
          <SettlementAmountColumn
            label={APP_TEXT.earnings.yourEarningLabel}
            amount={formatInr(settlement.workerEarningAmount)}
            amountColor={uiColors.status.successText}
          />
          <SettlementDashedDivider vertical />
          <View className="flex-1">
            <Text className="text-[11px] font-semibold" style={{ color: mutedTextColor }}>
              {APP_TEXT.earnings.netSettlementLabel}
            </Text>
            <SettlementCardNetBadge settlement={settlement.netSettlement} />
          </View>
        </View>
      </View>
    </>
  );
}
