import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
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
import { BookingOnlinePaymentOffersList } from '@/components/booking-details/BookingOnlinePaymentOffersList';
import { resolveOnlinePaymentAmountDisplay } from '@/utils/online-payment';
import { getStatusTileIconName } from '@/utils/status-badge';
import { palette, theme, uiColors } from '@/utils/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function replaceAmountToken(template: string, amount: string) {
  return template.replace('{amount}', amount);
}

type PaymentSummaryRowProps = {
  label: string;
  amount: string | number | null | undefined;
  tone?: BookingBillLineTone;
  emphasized?: boolean;
};

function PaymentSummaryRow({ label, amount, tone = 'default', emphasized = false }: PaymentSummaryRowProps) {
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
  actions,
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
    : APP_TEXT.main.bookings.paymentPendingLabel;
  const paymentStatusBadge = paymentStatus ?? 'PENDING';
  const paymentModeLabel = getBookingPaymentModeLabel(payment.paymentMode ?? payment.mode ?? null);
  const paidAtLabel = payment.paidAt
    ? formatBookingDateTime(payment.paidAt)
    : APP_TEXT.main.bookings.paymentPendingLabel;
  const receivedAmountColor = isPaymentPaid ? 'positive' : 'caution';
  const canPayOnline = Boolean(actions?.showOnlinePayment && actions.onlinePayment?.canPay);
  const onlineAmounts = actions?.onlinePayment
    ? resolveOnlinePaymentAmountDisplay(actions.onlinePayment, {
        savingsIfOnline: actions.displaySavingsIfOnline,
        onlinePaymentDiscountTotal: actions.displayDiscountTotal,
      })
    : null;
  const onlinePayableFormatted = onlineAmounts ? formatBookingMoney(onlineAmounts.onlinePayableAmount) : '';
  const currentPayableFormatted = onlineAmounts ? formatBookingMoney(onlineAmounts.currentPayableAmount) : '';
  const onlineSavingsFormatted = onlineAmounts ? formatBookingMoney(onlineAmounts.savingsAmount) : '';
  const showOnlineSavings = Boolean(onlineAmounts?.hasReducedOnlinePrice);
  const onlineOffers = actions?.displayOffers ?? [];
  const hasOnlineOffers = onlineOffers.length > 0;
  const flowState = actions?.flowState ?? 'idle';
  const statusMessage = flowState === 'refreshing'
    ? APP_TEXT.main.bookings.paymentOnlineRefreshing
    : flowState === 'processing'
      ? APP_TEXT.main.bookings.paymentOnlineProcessing
      : flowState === 'failed'
        ? APP_TEXT.main.bookings.paymentOnlineFailed
        : null;

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
          {APP_TEXT.main.bookings.paymentDetailsTitle}
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
              {APP_TEXT.main.bookings.paymentStatusLabel}
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
            label={APP_TEXT.main.bookings.paymentModeLabel}
            value={paymentModeLabel}
          />
          <PaymentMetaRow
            icon="calendar-outline"
            label={APP_TEXT.main.bookings.paymentPaidAtLabel}
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
                label={APP_TEXT.main.bookings.paymentBillAmountLabel}
                amount={billAmount}
              />
            ) : null}
            {hasBookingMoneyAmount(tipAmount) ? (
              <PaymentSummaryRow
                label={APP_TEXT.main.bookings.paymentTipLabel}
                amount={tipAmount}
                tone="positive"
              />
            ) : null}
          </View>

          <View className="my-4 h-px" style={{ backgroundColor: dividerColor }} />

          <PaymentSummaryRow
            label={APP_TEXT.main.bookings.paymentAmountReceivedLabel}
            amount={receivedAmount}
            tone={receivedAmountColor}
            emphasized
          />
        </View>

        {canPayOnline && actions?.onlinePayment ? (
          <View
            className="rounded-2xl border px-4 py-4"
            style={{
              borderColor: dividerColor,
              backgroundColor: panelBackground,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-extrabold text-baseDark dark:text-white">
                  {APP_TEXT.main.bookings.paymentOnlineSectionTitle}
                </Text>
                <Text className="mt-0.5 text-xs leading-5" style={{ color: mutedTextColor }}>
                  {APP_TEXT.main.bookings.paymentOnlineSectionSubtitle}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-bold uppercase tracking-[1px]" style={{ color: mutedTextColor }}>
                  {APP_TEXT.main.bookings.paymentOnlineYouPayLabel}
                </Text>
                {showOnlineSavings ? (
                  <Text
                    className="mt-0.5 text-sm font-semibold line-through"
                    style={{ color: mutedTextColor }}
                  >
                    {currentPayableFormatted}
                  </Text>
                ) : null}
                <Text className="text-xl font-black text-primary">{onlinePayableFormatted}</Text>
              </View>
            </View>

            {showOnlineSavings || hasOnlineOffers ? (
              <View className="mt-3 gap-3">
                {showOnlineSavings ? (
                  <View
                    className="self-start rounded-full px-3 py-1.5"
                    style={{ backgroundColor: isDark ? `${theme.colors.positive}22` : `${theme.colors.positive}14` }}
                  >
                    <Text className="text-xs font-extrabold" style={{ color: theme.colors.positive }}>
                      {replaceAmountToken(APP_TEXT.main.bookings.paymentOnlineSavingsLine, onlineSavingsFormatted)}
                    </Text>
                  </View>
                ) : null}
                {hasOnlineOffers ? (
                  <BookingOnlinePaymentOffersList
                    offers={onlineOffers}
                    disabled={actions.isBusy}
                    onSelectOffer={(couponCode) => actions.onPayOnline(couponCode)}
                  />
                ) : null}
              </View>
            ) : null}

            {statusMessage ? (
              <Text className="mt-3 text-sm leading-5" style={{ color: mutedTextColor }}>
                {statusMessage}
              </Text>
            ) : null}

            <Pressable
              disabled={actions.isBusy}
              onPress={() => actions.onPayOnline()}
              className="mt-4 rounded-xl px-4 py-3.5"
              style={{ backgroundColor: theme.colors.primary, opacity: actions.isBusy ? 0.7 : 1 }}
            >
              <View className="flex-row items-center justify-center gap-2">
                {actions.isBusy ? <ActivityIndicator color={theme.colors.onPrimary} /> : (
                  <Ionicons name="card-outline" size={17} color={theme.colors.onPrimary} />
                )}
                <Text className="text-base font-extrabold" style={{ color: theme.colors.onPrimary }}>
                  {APP_TEXT.main.bookings.paymentOnlinePayNowCta}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {actions?.canShowAddTip ? (
          <Pressable
            onPress={actions.onAddTip}
            className="rounded-2xl border px-4 py-4"
            style={{
              borderColor: dividerColor,
              backgroundColor: panelBackground,
              opacity: actions.onAddTip ? 1 : 0.6,
            }}
            disabled={!actions.onAddTip}
          >
            <View className="flex-row items-center">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? `${theme.colors.positive}22` : `${theme.colors.positive}14` }}
              >
                <Ionicons name="gift-outline" size={20} color={theme.colors.positive} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-extrabold text-baseDark dark:text-white">
                  {actions.hasTip ? APP_TEXT.main.bookings.tipAddedLabel : APP_TEXT.main.bookings.paymentTipSectionTitle}
                </Text>
                <Text className="mt-0.5 text-sm leading-5" style={{ color: mutedTextColor }}>
                  {actions.hasTip ? APP_TEXT.main.bookings.tipAvailableLabel : APP_TEXT.main.bookings.paymentTipSectionSubtitle}
                </Text>
              </View>
              {actions.hasTip ? (
                <Text className="text-lg font-extrabold" style={{ color: theme.colors.positive }}>
                  {formatBookingMoney(actions.tipAmount)}
                </Text>
              ) : (
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
              )}
            </View>

            {actions.hasTip && actions.onRemoveTip ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  actions.onRemoveTip?.();
                }}
                className="mt-3 self-start rounded-full border px-3 py-1.5"
                style={{ borderColor: theme.colors.secondary }}
              >
                <Text className="text-xs font-extrabold" style={{ color: theme.colors.secondary }}>
                  {APP_TEXT.main.bookings.removeTipAction}
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
