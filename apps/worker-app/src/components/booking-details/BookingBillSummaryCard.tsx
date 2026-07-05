import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { BookingBillLineTone, BookingBillSummaryCardProps } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import {
  formatBookingMoney,
  hasBookingMoneyAmount,
  resolveWorkerBillSummaryLines,
} from '@/utils/booking-details';
import { palette, theme, uiColors } from '@/utils/theme';

type BillRowProps = {
  label: string;
  amount: string | number | null | undefined;
  hint?: string;
  tone?: BookingBillLineTone;
  amountPrefix?: '+' | '-';
  emphasized?: boolean;
};

function BillRow({
  label,
  amount,
  hint,
  tone = 'default',
  amountPrefix,
  emphasized = false,
}: BillRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const amountColor = tone === 'positive'
    ? theme.colors.positive
    : tone === 'primary'
      ? theme.colors.primary
      : tone === 'caution'
        ? theme.colors.caution
        : undefined;
  const formattedAmount = amount == null ? '--' : formatBookingMoney(amount);
  const displayAmount = amountPrefix ? `${amountPrefix} ${formattedAmount}` : formattedAmount;

  return (
    <View>
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text
            className={`${emphasized ? 'text-sm font-bold' : 'text-sm'} text-baseDark dark:text-white`}
          >
            {label}
          </Text>
          {hint ? (
            <Text className="mt-1 text-xs leading-5" style={{ color: mutedTextColor }}>
              {hint}
            </Text>
          ) : null}
        </View>
        <Text
          className={`${emphasized ? 'text-lg' : 'text-base'} font-extrabold text-baseDark dark:text-white`}
          style={amountColor ? { color: amountColor } : undefined}
        >
          {displayAmount}
        </Text>
      </View>
    </View>
  );
}

export function BookingBillSummaryCard({ title, amounts }: BookingBillSummaryCardProps) {
  const isDark = useColorScheme() === 'dark';
  const lines = resolveWorkerBillSummaryLines(amounts);
  const workerEarningLabel = lines.workerEarningAmount == null
    ? APP_TEXT.jobs.payoutShownAfterRefresh
    : formatBookingMoney(lines.workerEarningAmount);
  const dividerColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;

  return (
    <View
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <View className="flex-row items-center px-4 py-4" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}>
        <Ionicons name="sparkles-outline" size={21} color={theme.colors.primary} />
        <Text className="ml-2 text-base font-extrabold uppercase tracking-[2px] text-baseDark dark:text-white">
          {title}
        </Text>
      </View>

      <View className="gap-4 p-4">
        {hasBookingMoneyAmount(lines.subtotalAmount) ? (
          <BillRow
            label={APP_TEXT.jobs.billSubtotalLabel}
            amount={lines.subtotalAmount}
          />
        ) : null}

        {hasBookingMoneyAmount(lines.tipAmount) ? (
          <BillRow
            label={APP_TEXT.jobs.paymentTipLabel}
            amount={lines.tipAmount}
            hint={APP_TEXT.jobs.billTipHint}
            amountPrefix="+"
            tone="positive"
          />
        ) : null}

        {hasBookingMoneyAmount(lines.totalAmount) ? (
          <>
            <View className="h-px" style={{ backgroundColor: dividerColor }} />
            <BillRow
              label={APP_TEXT.jobs.billTotalLabel}
              amount={lines.totalAmount}
              emphasized
            />
          </>
        ) : null}

        {hasBookingMoneyAmount(lines.commissionAmount) ? (
          <BillRow
            label={APP_TEXT.jobs.billCommissionLabel}
            amount={lines.commissionAmount}
            hint={APP_TEXT.jobs.billCommissionHint}
            amountPrefix="-"
            tone="primary"
          />
        ) : null}

        <View className="h-px" style={{ backgroundColor: dividerColor }} />

        <View className="flex-row items-center justify-between px-1 py-1">
          <Text className="text-sm font-bold" style={{ color: theme.colors.positive }}>
            {APP_TEXT.jobs.workerPayoutLabel}
          </Text>
          <Text className="text-2xl font-extrabold" style={{ color: theme.colors.positive }}>
            {workerEarningLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}
