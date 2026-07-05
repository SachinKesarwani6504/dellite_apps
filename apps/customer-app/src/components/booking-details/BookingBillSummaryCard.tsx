import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { BookingBillLineTone, BookingBillSummaryCardProps } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { formatBookingMoney, hasBookingMoneyAmount } from '@/utils/booking-details';
import { palette, theme, uiColors } from '@/utils/theme';

type BillRowProps = {
  label: string;
  amount: string | number | null | undefined;
  hint?: string;
  tone?: BookingBillLineTone;
  isDeduction?: boolean;
  large?: boolean;
};

function BillRow({ label, amount, hint, tone = 'default', isDeduction = false, large = false }: BillRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const amountColor = tone === 'positive'
    ? theme.colors.positive
    : tone === 'primary'
      ? theme.colors.primary
      : tone === 'caution'
        ? theme.colors.caution
        : undefined;

  return (
    <View>
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className={`${large ? 'text-sm font-bold' : 'text-sm'} text-baseDark dark:text-white`}>{label}</Text>
          {hint ? (
            <Text className="mt-1 text-xs" style={{ color: mutedTextColor }}>
              {hint}
            </Text>
          ) : null}
        </View>
        <Text
          className={`${large ? 'text-2xl' : 'text-base'} font-extrabold text-baseDark dark:text-white`}
          style={amountColor ? { color: amountColor } : undefined}
        >
          {isDeduction ? `- ${formatBookingMoney(amount)}` : formatBookingMoney(amount)}
        </Text>
      </View>
    </View>
  );
}

export function BookingBillSummaryCard({ title, amounts, isPaymentComplete = false }: BookingBillSummaryCardProps) {
  const isDark = useColorScheme() === 'dark';
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
        {hasBookingMoneyAmount(amounts.subtotalAmount) ? (
          <BillRow label={APP_TEXT.main.bookingFlow.quoteSubtotal} amount={amounts.subtotalAmount} />
        ) : null}
        {hasBookingMoneyAmount(amounts.platformFeeAmount) ? (
          <BillRow
            label={APP_TEXT.main.bookingFlow.quotePlatformFee}
            amount={amounts.platformFeeAmount}
            hint={APP_TEXT.main.bookingFlow.quotePlatformFeeHint}
          />
        ) : null}
        {hasBookingMoneyAmount(amounts.taxAmount) ? (
          <BillRow label={APP_TEXT.main.bookingFlow.quoteTax} amount={amounts.taxAmount} />
        ) : null}
        {hasBookingMoneyAmount(amounts.discountAmount) ? (
          <BillRow
            label={APP_TEXT.main.bookingFlow.quoteDiscount}
            amount={amounts.discountAmount}
            tone="positive"
            isDeduction
          />
        ) : null}

        {hasBookingMoneyAmount(amounts.tipAmount) ? (
          <BillRow label={APP_TEXT.main.bookings.paymentTipLabel} amount={amounts.tipAmount} tone="positive" />
        ) : null}

        <View className="h-px" style={{ backgroundColor: dividerColor }} />

        <BillRow
          label={APP_TEXT.main.bookingFlow.quoteTotalPay}
          amount={amounts.bookingTotalAmount}
          tone={isPaymentComplete ? 'positive' : 'default'}
          large
        />
      </View>
    </View>
  );
}
