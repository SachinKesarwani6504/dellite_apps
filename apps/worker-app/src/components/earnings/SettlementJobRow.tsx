import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import type { SettlementJobRowProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import {
  formatInr,
  formatIstDateTime,
  formatSettlementJobServicesLabel,
  getEarningsCardShadowStyle,
  getSettlementJobPaymentModeLabel,
  getSettlementJobPaymentModeTone,
} from '@/utils/worker-finance';
import { palette, uiColors } from '@/utils/theme';

function JobAmountRow({ label, amount, highlight }: { label: string; amount: string; highlight?: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View className="flex-1">
      <Text className="text-[11px] font-semibold" style={{ color: mutedTextColor }}>
        {label}
      </Text>
      <Text
        className={`mt-0.5 text-sm font-extrabold ${highlight ? '' : 'text-baseDark dark:text-white'}`}
        style={highlight ? { color: uiColors.status.successText } : undefined}
      >
        {amount}
      </Text>
    </View>
  );
}

export function SettlementJobRow({ job, onPress }: SettlementJobRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const paymentTone = getSettlementJobPaymentModeTone(job.paymentMode, isDark);
  const servicesLabel = formatSettlementJobServicesLabel(job.services);

  const content = (
    <>
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <View
            className="self-start flex-row items-center rounded-full border px-2.5 py-1"
            style={{
              backgroundColor: paymentTone.backgroundColor,
              borderColor: paymentTone.borderColor,
            }}
          >
            <Ionicons
              name={paymentTone.iconName as keyof typeof Ionicons.glyphMap}
              size={12}
              color={paymentTone.textColor}
              style={{ marginRight: 4 }}
            />
            <Text className="text-[11px] font-extrabold" style={{ color: paymentTone.textColor }}>
              {getSettlementJobPaymentModeLabel(job.paymentMode)}
            </Text>
          </View>
          <Text className="mt-2 text-base font-extrabold text-baseDark dark:text-white" numberOfLines={3}>
            {servicesLabel || APP_TEXT.earnings.bookingCodeFallback}
          </Text>
          <Text className="mt-1 text-xs" style={{ color: mutedTextColor }}>
            {`${job.bookingCode} · ${formatIstDateTime(job.completedAt)}`}
          </Text>
        </View>
        {onPress ? (
          <Ionicons name="chevron-forward" size={16} color={isDark ? uiColors.text.captionDark : uiColors.text.captionLight} />
        ) : null}
      </View>

      <View className="mt-4 flex-row">
        <JobAmountRow label={APP_TEXT.earnings.paidAmountLabel} amount={formatInr(job.paidAmount)} />
        <View className="mx-2 w-px self-stretch" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
        <JobAmountRow label={APP_TEXT.earnings.yourEarningLabel} amount={formatInr(job.workerEarningAmount)} highlight />
        <View className="mx-2 w-px self-stretch" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
        <JobAmountRow label={APP_TEXT.earnings.commissionLabel} amount={formatInr(job.commissionAmount)} />
      </View>
    </>
  );

  const cardStyle = {
    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
    backgroundColor: isDark ? palette.dark.card : palette.light.card,
    ...getEarningsCardShadowStyle(isDark),
  };

  if (!onPress) {
    return (
      <View className="rounded-2xl border p-4" style={cardStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} className="rounded-2xl border p-4" style={cardStyle}>
      {content}
    </Pressable>
  );
}
