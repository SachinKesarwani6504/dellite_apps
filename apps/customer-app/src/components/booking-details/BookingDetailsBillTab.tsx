import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { APP_TEXT } from '@/utils/appText';
import { formatBookingMoney } from '@/utils/booking-details';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingDetailsBillTab() {
  const isDark = useColorScheme() === 'dark';
  const { details } = useBookingDetailsContext();
  if (!details) return null;

  return (
    <View
      className="mt-5 overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <View className="flex-row items-center px-4 py-4" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}>
        <Ionicons name="sparkles-outline" size={21} color={theme.colors.primary} />
        <Text className="ml-2 text-base font-extrabold uppercase tracking-[2px] text-baseDark dark:text-white">
          {APP_TEXT.main.bookingFlow.billSummaryTitle}
        </Text>
      </View>

      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.quoteSubtotal}</Text>
          <Text className="text-base font-extrabold text-baseDark dark:text-white">{formatBookingMoney(details.booking.subtotalAmount)}</Text>
        </View>
        <View className="mt-4 flex-row items-start justify-between">
          <View>
            <Text className="text-sm text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.quotePlatformFee}</Text>
            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.main.bookingFlow.quotePlatformFeeHint}
            </Text>
          </View>
          <Text className="text-base font-extrabold text-baseDark dark:text-white">{formatBookingMoney(details.booking.platformFeeAmount)}</Text>
        </View>
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-sm text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.quoteDiscount}</Text>
          <Text className="text-base font-extrabold" style={{ color: theme.colors.positive }}>
            - {formatBookingMoney(details.booking.discountAmount)}
          </Text>
        </View>
        <View className="my-4 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
        <View className="flex-row items-center justify-between px-1 py-1">
          <Text className="text-sm font-bold text-baseDark dark:text-white">
            {APP_TEXT.main.bookingFlow.quoteTotalPay}
          </Text>
          <Text className="text-2xl font-extrabold" style={{ color: theme.colors.caution }}>
            {formatBookingMoney(details.booking.totalAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
}
