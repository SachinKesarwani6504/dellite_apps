import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { SettlementPayoutInvoiceCardProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { showToast } from '@/utils/toast';
import {
  formatInr,
  formatIstDateTime,
  formatSettlementPayoutProvider,
  getEarningsCardShadowStyle,
  getSettlementPayoutMethodLabel,
  getSettlementPayoutProofReference,
  getSettlementPayoutStatusSubtitle,
  getSettlementPayoutStatusTitle,
  getSettlementPayoutStatusTone,
  hasNonZeroFinanceAmount,
} from '@/utils/worker-finance';
import { palette, theme, uiColors } from '@/utils/theme';

type DetailRowProps = {
  label: string;
  value: string;
  valueColor?: string;
  helperText?: string;
  onCopy?: () => void;
  compact?: boolean;
};

function DetailRow({
  label,
  value,
  valueColor,
  helperText,
  onCopy,
  compact = false,
}: DetailRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View className="py-2">
      <Text className="text-xs font-semibold uppercase tracking-[0.8px]" style={{ color: mutedTextColor }}>
        {label}
      </Text>
      <View className="mt-1 flex-row items-center justify-between gap-3">
        <Text
          className={compact ? 'flex-1 text-xs font-semibold' : 'flex-1 text-sm font-extrabold text-baseDark dark:text-white'}
          style={[
            compact ? { color: mutedTextColor } : undefined,
            valueColor ? { color: valueColor } : undefined,
          ]}
        >
          {value}
        </Text>
        {onCopy ? (
          <Pressable
            onPress={onCopy}
            className="flex-row items-center rounded-full border px-2.5 py-1"
            style={{ borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}
          >
            <Ionicons name="copy-outline" size={12} color={theme.colors.primary} />
            <Text className="ml-1 text-xs font-bold text-primary">
              {APP_TEXT.earnings.payoutUtrCopyAction}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {helperText ? (
        <Text className="mt-1 text-xs leading-5" style={{ color: mutedTextColor }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

type AmountRowProps = {
  label: string;
  amount: string;
  emphasized?: boolean;
};

function AmountRow({ label, amount, emphasized = false }: AmountRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm" style={{ color: mutedTextColor }}>
        {label}
      </Text>
      <Text className={emphasized ? 'text-base font-extrabold text-baseDark dark:text-white' : 'text-sm font-bold text-baseDark dark:text-white'}>
        {amount}
      </Text>
    </View>
  );
}

export function SettlementPayoutInvoiceCard({
  payoutInvoice,
  onOpenPayoutDetails,
}: SettlementPayoutInvoiceCardProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const dividerColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const statusTone = getSettlementPayoutStatusTone(payoutInvoice.status, isDark);
  const statusSubtitle = getSettlementPayoutStatusSubtitle(
    payoutInvoice.status,
    payoutInvoice.blockedReason,
  );
  const providerLabel = formatSettlementPayoutProvider(payoutInvoice.provider);
  const methodLabel = getSettlementPayoutMethodLabel(payoutInvoice.method);
  const proofReference = getSettlementPayoutProofReference(payoutInvoice);
  const showAdjustedAmount = hasNonZeroFinanceAmount(payoutInvoice.commissionAdjustedAmount);
  const isPaid = payoutInvoice.status === 'PAID';
  const isBlocked = payoutInvoice.status === 'BLOCKED';
  const showBankInfoCta = isBlocked
    && payoutInvoice.blockedReason?.toUpperCase() === 'BANK_INFO_MISSING'
    && Boolean(onOpenPayoutDetails);

  const handleCopyProofReference = async () => {
    if (!proofReference) return;
    await Clipboard.setStringAsync(proofReference);
    showToast('success', APP_TEXT.earnings.payoutUtrCopySuccess);
  };

  return (
    <View
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        ...getEarningsCardShadowStyle(isDark),
      }}
    >
      <View
        className="flex-row items-center px-4 py-3"
        style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}
      >
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
        >
          <Ionicons name="wallet-outline" size={16} color={theme.colors.primary} />
        </View>
        <Text className="ml-2 text-xs font-bold uppercase tracking-[1.2px]" style={{ color: mutedTextColor }}>
          {APP_TEXT.earnings.payoutSectionTitle}
        </Text>
      </View>

      <View className="px-4 py-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text
              className="text-lg font-extrabold text-baseDark dark:text-white"
              style={isPaid ? { color: uiColors.status.successText } : undefined}
            >
              {getSettlementPayoutStatusTitle(payoutInvoice.status)}
            </Text>
            {statusSubtitle ? (
              <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
                {statusSubtitle}
              </Text>
            ) : null}
            {payoutInvoice.status === 'FAILED' && payoutInvoice.failureReason ? (
              <Text className="mt-1 text-sm font-semibold" style={{ color: uiColors.status.dangerText }}>
                {payoutInvoice.failureReason}
              </Text>
            ) : null}
            {isBlocked && payoutInvoice.blockedReason && payoutInvoice.blockedReason !== 'BANK_INFO_MISSING' ? (
              <Text className="mt-1 text-sm font-semibold" style={{ color: uiColors.status.warningText }}>
                {payoutInvoice.blockedReason}
              </Text>
            ) : null}
          </View>
          <View
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: statusTone.backgroundColor }}
          >
            <Text className="text-xs font-extrabold" style={{ color: statusTone.textColor }}>
              {formatInr(payoutInvoice.payoutAmount)}
            </Text>
          </View>
        </View>

        {(payoutInvoice.status === 'PENDING' || payoutInvoice.status === 'PROCESSING') && providerLabel ? (
          <View className="mt-3">
            <DetailRow label={APP_TEXT.earnings.payoutProviderLabel} value={providerLabel} />
          </View>
        ) : null}

        <View className="mt-3">
          <AmountRow label={APP_TEXT.earnings.payoutGrossLabel} amount={formatInr(payoutInvoice.grossAmount)} />
          {showAdjustedAmount ? (
            <AmountRow
              label={APP_TEXT.earnings.payoutAdjustedLabel}
              amount={formatInr(payoutInvoice.commissionAdjustedAmount)}
            />
          ) : null}
          <AmountRow
            label={APP_TEXT.earnings.payoutNetPaidLabel}
            amount={formatInr(payoutInvoice.payoutAmount)}
            emphasized
          />
        </View>

        {isPaid ? (
          <View
            className="mt-4 rounded-2xl border px-3"
            style={{
              borderColor: dividerColor,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            {proofReference ? (
              <DetailRow
                label={APP_TEXT.earnings.payoutUtrLabel}
                value={proofReference}
                helperText={APP_TEXT.earnings.payoutUtrHelper}
                onCopy={() => {
                  void handleCopyProofReference();
                }}
              />
            ) : null}
            {payoutInvoice.paidAt ? (
              <DetailRow
                label={APP_TEXT.earnings.payoutPaidOnLabel}
                value={formatIstDateTime(payoutInvoice.paidAt)}
              />
            ) : null}
            {payoutInvoice.maskedDestination ? (
              <View className="py-2">
                <Text className="text-xs font-semibold uppercase tracking-[0.8px]" style={{ color: mutedTextColor }}>
                  {APP_TEXT.earnings.payoutPaidToLabel}
                </Text>
                <View className="mt-1 flex-row flex-wrap items-center gap-2">
                  <Text className="text-sm font-extrabold text-baseDark dark:text-white">
                    {payoutInvoice.maskedDestination}
                  </Text>
                  {methodLabel ? (
                    <StatusBadge
                      status="PAID"
                      type="payment"
                      label={methodLabel}
                      showDot={false}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}
            {payoutInvoice.providerPayoutId ? (
              <DetailRow
                label={APP_TEXT.earnings.payoutTransactionIdLabel}
                value={payoutInvoice.providerPayoutId}
                compact
              />
            ) : null}
          </View>
        ) : null}

        {showBankInfoCta ? (
          <Pressable
            onPress={onOpenPayoutDetails}
            className="mt-4 rounded-xl px-4 py-3.5"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="text-center text-sm font-extrabold" style={{ color: theme.colors.onPrimary }}>
              {APP_TEXT.earnings.payoutAddDetailsAction}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
