import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { GradientScreen } from '@/components/common/GradientScreen';
import type { BookingDetailsScreenProps } from '@/types/main-screens';
import { APP_TEXT } from '@/utils/appText';
import { findCustomerBookingById } from '@/utils/customer-bookings';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingDetailsScreen({ navigation, route }: BookingDetailsScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { bookingId } = route.params;
  const booking = findCustomerBookingById(bookingId);

  return (
    <GradientScreen contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <Text className="text-[30px] font-extrabold leading-[34px] text-baseDark dark:text-white">
        {APP_TEXT.main.bookings.detailsTitle}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
        {APP_TEXT.main.bookings.detailsSubtitle}
      </Text>

      <View
        className="mt-5 rounded-2xl border p-4"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        }}
      >
        <View className="flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}
          >
            <Ionicons name="receipt-outline" size={21} color={theme.colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs font-extrabold uppercase" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.main.bookings.detailsReferenceLabel}
            </Text>
            <Text className="mt-1 text-base font-extrabold text-baseDark dark:text-white">{bookingId}</Text>
          </View>
        </View>
      </View>

      {booking ? (
        <View
          className="mt-3 overflow-hidden rounded-2xl border"
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
          }}
        >
          <View className="p-4">
            <Text className="text-xs font-extrabold uppercase" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.main.bookings.detailsServiceLabel}
            </Text>
            <Text className="mt-1 text-xl font-extrabold text-baseDark dark:text-white">{booking.serviceTitle}</Text>
            <Text className="mt-1 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {booking.category}
            </Text>
          </View>

          <View className="h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />

          <View className="gap-3 p-4">
            <View className="flex-row items-center justify-between">
              <View className="mr-3 flex-row items-center">
                <Ionicons name="pulse-outline" size={16} color={theme.colors.primary} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {APP_TEXT.main.bookings.detailsStatusLabel}
                </Text>
              </View>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: booking.accentColor }}>
                <Text className="text-xs font-extrabold text-white">{booking.statusLabel}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="mr-3 flex-row items-center">
                <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {APP_TEXT.main.bookings.detailsWorkerLabel}
                </Text>
              </View>
              <Text className="flex-1 text-right text-sm font-extrabold text-baseDark dark:text-white">{booking.workerName}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="mr-3 flex-row items-center">
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {APP_TEXT.main.bookings.detailsScheduleLabel}
                </Text>
              </View>
              <Text className="flex-1 text-right text-sm font-extrabold text-baseDark dark:text-white">{booking.slotLabel}</Text>
            </View>

            <View className="flex-row items-start justify-between">
              <View className="mr-3 flex-row items-center">
                <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {APP_TEXT.main.bookings.detailsAddressLabel}
                </Text>
              </View>
              <Text className="flex-1 text-right text-sm font-extrabold leading-5 text-baseDark dark:text-white">{booking.address}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="mr-3 flex-row items-center">
                <Ionicons name="wallet-outline" size={16} color={theme.colors.primary} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {APP_TEXT.main.bookings.detailsAmountLabel}
                </Text>
              </View>
              <Text className="flex-1 text-right text-lg font-extrabold text-primary">{booking.amountLabel}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View
          className="mt-3 rounded-2xl border p-4"
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
          }}
        >
          <Text className="text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {APP_TEXT.main.bookings.detailsUnavailable}
          </Text>
        </View>
      )}
    </GradientScreen>
  );
}
