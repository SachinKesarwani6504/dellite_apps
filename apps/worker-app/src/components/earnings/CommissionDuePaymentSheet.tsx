import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { CommissionDuePaymentMethod, CommissionDuePaymentSheetProps } from '@/types/worker-finance';
import { isRazorpayProviderAvailable } from '@/payments/paymentProvider';
import { APP_TEXT } from '@/utils/appText';
import {
  PHONEPE_PROVIDER_ICON,
  RAZORPAY_PROVIDER_ICON,
} from '@/utils/payment-provider-assets';
import { formatInr } from '@/utils/worker-finance';
import { palette, theme, uiColors } from '@/utils/theme';

const PAY_METHOD_BUTTON_WIDTH = 68;
const PAY_METHOD_BUTTON_HEIGHT = 36;

type PaymentOptionConfig = {
  method: CommissionDuePaymentMethod;
  label: string;
  subtitle: string;
  image: number;
  enabled: boolean;
  comingSoon?: boolean;
};

function PaymentMethodPayButton({
  enabled,
  isLoading,
  isBusy,
  onPress,
}: {
  enabled: boolean;
  isLoading: boolean;
  isBusy: boolean;
  onPress: () => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <Pressable
      disabled={!enabled || isBusy}
      onPress={onPress}
      style={{
        width: PAY_METHOD_BUTTON_WIDTH,
        height: PAY_METHOD_BUTTON_HEIGHT,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: enabled
          ? theme.colors.primary
          : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight),
        opacity: enabled ? 1 : 0.55,
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={enabled ? theme.colors.onPrimary : mutedTextColor} />
      ) : (
        <Text
          className="text-xs font-extrabold"
          style={{ color: enabled ? theme.colors.onPrimary : mutedTextColor }}
        >
          {APP_TEXT.earnings.commissionPaySelectAction}
        </Text>
      )}
    </Pressable>
  );
}

const PAYMENT_OPTIONS: PaymentOptionConfig[] = [
  {
    method: 'RAZORPAY',
    label: APP_TEXT.earnings.commissionPayRazorpayLabel,
    subtitle: APP_TEXT.earnings.commissionPayRazorpaySubtitle,
    image: RAZORPAY_PROVIDER_ICON,
    enabled: true,
  },
  {
    method: 'PHONEPE',
    label: APP_TEXT.earnings.commissionPayPhonePeLabel,
    subtitle: APP_TEXT.earnings.commissionPayPhonePeComingSoon,
    image: PHONEPE_PROVIDER_ICON,
    enabled: false,
    comingSoon: true,
  },
];

export function CommissionDuePaymentSheet({
  amount,
  providers,
  onPay,
  onClose,
}: CommissionDuePaymentSheetProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const cardBorderColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const [payingMethod, setPayingMethod] = useState<CommissionDuePaymentMethod | null>(null);
  const visibleOptions = PAYMENT_OPTIONS.filter((option) => {
    if (option.method === 'RAZORPAY') {
      return isRazorpayProviderAvailable(providers);
    }
    return providers.includes(option.method) || option.comingSoon;
  }).map((option) => ({
    ...option,
    enabled: option.comingSoon
      ? false
      : option.method === 'RAZORPAY'
        ? isRazorpayProviderAvailable(providers)
        : providers.includes(option.method),
  }));

  const handleSelectMethod = async (option: PaymentOptionConfig) => {
    if (!option.enabled || payingMethod) return;

    setPayingMethod(option.method);
    try {
      const result = await onPay(option.method);
      if (result === 'done' || result === 'processing' || result === 'timeout') {
        onClose();
        return;
      }
      setPayingMethod(null);
    } catch {
      setPayingMethod(null);
    }
  };

  return (
    <View className="gap-4">
      <View
        className="overflow-hidden rounded-3xl border"
        style={{
          borderColor: isDark ? `${theme.colors.primary}33` : `${theme.colors.primary}22`,
          backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40,
        }}
      >
        <View className="items-center px-5 py-6">
          <Text className="text-xs font-bold uppercase tracking-[1.6px]" style={{ color: mutedTextColor }}>
            {APP_TEXT.earnings.commissionPaySheetAmountLabel}
          </Text>
          <Text className="mt-2 text-4xl font-black text-baseDark dark:text-white">
            {formatInr(amount)}
          </Text>
        </View>
      </View>

      <Text className="text-sm leading-5" style={{ color: mutedTextColor }}>
        {APP_TEXT.earnings.commissionPaySheetSubtitle}
      </Text>

      <View className="gap-3">
        {visibleOptions.map((option) => {
          const isLoading = payingMethod === option.method;
          const isRowBusy = Boolean(payingMethod) && !isLoading;

          return (
            <View
              key={option.method}
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: cardBorderColor,
                backgroundColor: isDark ? palette.dark.card : palette.light.card,
                opacity: isRowBusy ? 0.6 : 1,
              }}
            >
              <View className="flex-row items-center px-4 py-4">
                <View
                  className="items-center justify-center overflow-hidden rounded-2xl"
                  style={{
                    width: 52,
                    height: 52,
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
                  }}
                >
                  <AppImage
                    source={option.image}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                </View>
                <View className="ml-3 flex-1 pr-2">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-base font-extrabold text-baseDark dark:text-white">
                      {option.label}
                    </Text>
                    {option.comingSoon ? (
                      <StatusBadge
                        status="PENDING"
                        type="payment"
                        label={APP_TEXT.earnings.commissionPayComingSoonBadge}
                        showDot={false}
                      />
                    ) : null}
                  </View>
                  <Text className="mt-1 text-xs leading-5" style={{ color: mutedTextColor }}>
                    {option.subtitle}
                  </Text>
                </View>
                <PaymentMethodPayButton
                  enabled={option.enabled}
                  isLoading={isLoading}
                  isBusy={Boolean(payingMethod)}
                  onPress={() => {
                    void handleSelectMethod(option);
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
