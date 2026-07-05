import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { BookingBillLineTone, BookingPaymentDetailsCardProps } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import {
  formatBookingDateTime,
  formatBookingMoney,
  getBookingPaymentModeLabel,
  getBookingPaymentStatusLabel,
  hasBookingMoneyAmount,
  isBookingPaymentPending,
  isBookingPaymentProblem,
  isBookingPaymentSuccessful,
  resolveBookingPaymentBreakdown,
} from '@/utils/booking-details';
import { getStatusTileIconName } from '@/utils/status-badge';
import { palette, theme, uiColors } from '@/utils/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type PaymentSummaryRowProps = {
  label: string;
  amount: string | number | null | undefined;
  tone?: BookingBillLineTone;
  emphasized?: boolean;
};

function PaymentSummaryRow({ label, amount, tone = 'default', emphasized = false }: PaymentSummaryRowProps) {
  const isDark = useColorScheme() === 'dark';
  const amountColor = tone === 'positive'
    ? theme.colors.positive
    : tone === 'caution'
      ? theme.colors.caution
      : undefined;

  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={emphasized ? 'text-sm font-bold text-baseDark dark:text-white' : 'text-sm text-baseDark dark:text-white'}
      >
        {label}
      </Text>
      <Text
        className={emphasized ? 'text-xl font-extrabold text-baseDark dark:text-white' : 'text-base font-extrabold text-baseDark dark:text-white'}
        style={amountColor ? { color: amountColor } : undefined}
      >
        {amount == null ? '--' : formatBookingMoney(amount)}
      </Text>
    </View>
  );
}

type PaymentMetaRowProps = {
  icon: IoniconName;
  label: string;
  value: string;
};

function PaymentMetaRow({ icon, label, value }: PaymentMetaRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="mr-3 flex-1 flex-row items-center">
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
        <Text className="ml-2 text-sm" style={{ color: mutedTextColor }}>
          {label}
        </Text>
      </View>
      <Text className="max-w-[58%] text-right text-sm font-extrabold text-baseDark dark:text-white">
        {value}
      </Text>
    </View>
  );
}

export function BookingPaymentDetailsCard({
  paymentStatus,
  payment,
  statusCopy,
}: BookingPaymentDetailsCardProps) {
  const isDark = useColorScheme() === 'dark';
  const cardBorderColor = isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight;
  const dividerColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const panelBackground = isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95;
  const { billAmount, tipAmount, receivedAmount } = resolveBookingPaymentBreakdown(payment);
  const isPaymentPending = !paymentStatus || isBookingPaymentPending(paymentStatus);
  const isPaymentProblem = isBookingPaymentProblem(paymentStatus);
  const isPaymentPaid = isBookingPaymentSuccessful(paymentStatus);
  const statusSoftBackground = isPaymentPending
    ? (isDark ? uiColors.status.warningDark : uiColors.status.warningLight)
    : isPaymentProblem
      ? (isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight)
      : (isDark ? uiColors.status.successDark : uiColors.status.successLight);
  const statusTextColor = isPaymentPending
    ? uiColors.status.warningText
    : isPaymentProblem
      ? uiColors.status.dangerText
      : uiColors.status.successText;
  const statusIconName: IoniconName = isPaymentPending
    ? 'time-outline'
    : isPaymentProblem
      ? 'alert-circle-outline'
      : 'checkmark-circle-outline';
  const paymentStatusLabel = paymentStatus
    ? getBookingPaymentStatusLabel(paymentStatus)
    : APP_TEXT.jobs.paymentPendingLabel;
  const paymentStatusBadge = paymentStatus ?? 'PENDING';
  const paymentModeLabel = getBookingPaymentModeLabel(payment.paymentMode ?? payment.mode ?? null);
  const paidAtLabel = payment.paidAt
    ? formatBookingDateTime(payment.paidAt)
    : APP_TEXT.jobs.paymentPendingLabel;
  const receivedAmountColor = isPaymentPaid ? 'positive' : 'caution';

  return (
    <View
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: cardBorderColor,
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
      }}
    >
      <View
        className="flex-row items-center px-4 py-4"
        style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}
      >
        <Ionicons name="card-outline" size={21} color={theme.colors.primary} />
        <Text className="ml-2 text-base font-extrabold uppercase tracking-[2px] text-baseDark dark:text-white">
          {APP_TEXT.jobs.paymentDetailsTitle}
        </Text>
      </View>

      <View className="gap-4 p-4">
        <View
          className="flex-row items-start rounded-2xl px-4 py-4"
          style={{ backgroundColor: statusSoftBackground }}
        >
          <View
            className="items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name={statusIconName} size={22} color={statusTextColor} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{ color: mutedTextColor }}>
              {APP_TEXT.jobs.paymentStatusLabel}
            </Text>
            <Text className="mt-1 text-base font-extrabold" style={{ color: statusTextColor }}>
              {statusCopy.title}
            </Text>
          </View>
          <StatusBadge
            status={paymentStatusBadge}
            type="payment"
            label={paymentStatusLabel}
            iconName={getStatusTileIconName(paymentStatusBadge)}
          />
        </View>

        <View>
          <PaymentMetaRow
            icon="swap-horizontal-outline"
            label={APP_TEXT.jobs.paymentModeLabel}
            value={paymentModeLabel}
          />
          <PaymentMetaRow
            icon="calendar-outline"
            label={APP_TEXT.jobs.paymentPaidAtLabel}
            value={paidAtLabel}
          />
        </View>

        <View
          className="rounded-2xl border px-4 py-4"
          style={{
            borderColor: dividerColor,
            backgroundColor: panelBackground,
          }}
        >
          <View className="gap-3">
            {hasBookingMoneyAmount(billAmount) ? (
              <PaymentSummaryRow
                label={APP_TEXT.jobs.paymentBillAmountLabel}
                amount={billAmount}
              />
            ) : null}
            {hasBookingMoneyAmount(tipAmount) ? (
              <PaymentSummaryRow
                label={APP_TEXT.jobs.paymentTipLabel}
                amount={tipAmount}
                tone="positive"
              />
            ) : null}
          </View>

          <View className="my-4 h-px" style={{ backgroundColor: dividerColor }} />

          <PaymentSummaryRow
            label={APP_TEXT.jobs.paymentAmountReceivedLabel}
            amount={receivedAmount}
            tone={receivedAmountColor}
            emphasized
          />
        </View>
      </View>
    </View>
  );
}
