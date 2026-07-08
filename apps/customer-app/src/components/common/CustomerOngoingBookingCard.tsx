import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { AppImage } from '@/components/common/AppImage';
import { RatingBadge } from '@/components/common/RatingBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatusInfoTile } from '@/components/common/StatusInfoTile';
import type { CustomerOngoingBookingCardProps } from '@/types/component-types';
import { formatTitle } from '@/utils';
import {
  getCustomerBookingAmountLabel,
  getCustomerBookingReferenceLabel,
  getCustomerBookingScheduledDateTimeLabel,
  getCustomerBookingTypeChipLabel,
  getCustomerBookingWorkerAverageRating,
  getCustomerBookingWorkerImageUrl,
  getCustomerBookingWorkerInitial,
  getCustomerBookingWorkerName,
  getCustomerBookingWorkerSubtitle,
  isCustomerInstantBooking,
} from '@/utils/customer-bookings';
import { getBookingPaymentStatusLabel } from '@/utils/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { getStatusBadgeTextColor, getStatusTileIconName } from '@/utils/status-badge';
import { palette, theme, uiColors } from '@/utils/theme';

const CARD_WIDTH = 300;

const panelStyle = (isDark: boolean) => ({
  backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmCardLight,
});

export function CustomerOngoingBookingCard({
  item,
  onPress,
}: CustomerOngoingBookingCardProps) {
  const isDark = useColorScheme() === 'dark';
  const statusAccentColor = getStatusBadgeTextColor(item.bookingStatus, 'booking');
  const workerName = getCustomerBookingWorkerName(item);
  const workerInitial = getCustomerBookingWorkerInitial(item);
  const workerImageUrl = getCustomerBookingWorkerImageUrl(item);
  const workerAverageRating = getCustomerBookingWorkerAverageRating(item);
  const workerSubtitle = getCustomerBookingWorkerSubtitle(item);
  const amountLabel = getCustomerBookingAmountLabel(item);
  const inviteStatus = item.invite?.inviteStatus ?? null;
  const paymentStatus = item.paymentStatus ?? null;
  const paymentStatusLabel = paymentStatus ? getBookingPaymentStatusLabel(paymentStatus) : null;
  const firstService = item.services?.[0];
  const subcategoryName = formatTitle(firstService?.subCategory || 'Service Booking');
  const isInstant = isCustomerInstantBooking(item);
  const typeChipLabel = getCustomerBookingTypeChipLabel(item);
  const scheduledDateTime = getCustomerBookingScheduledDateTimeLabel(item);
  const bookingCode = getCustomerBookingReferenceLabel(item);
  const cardStyle = {
    backgroundColor: isDark ? palette.dark.card : palette.light.card,
    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight,
    shadowColor: uiColors.shadow.base,
    shadowOpacity: isDark ? 0 : 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  };

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      className="overflow-hidden rounded-2xl border"
      style={{
        width: CARD_WIDTH,
        ...cardStyle,
        borderTopWidth: 4,
        borderTopColor: statusAccentColor,
      }}
    >
      <View className="p-3.5">
        <View>
          <Text className="text-lg font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
            {subcategoryName}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
              {(item.services || []).slice(0, 2).map(service => (
                <StatusBadge
                  key={service.id ?? service.serviceName ?? 'service'}
                  status="CONFIRMED"
                  label={formatTitle(service.serviceName ?? undefined)}
                  showDot={false}
                />
              ))}
            {(item.services?.length ?? 0) > 2 ? (
              <StatusBadge status="CONFIRMED" label={`+${(item.services?.length ?? 0) - 2}`} showDot={false} />
            ) : null}
          </View>
        </View>

        <View className="mt-3 gap-2">
          {isInstant ? (
            <View className="flex-row items-center gap-2">
              <View
                className="flex-1 flex-row items-center rounded-xl px-3 py-2"
                style={panelStyle(isDark)}
              >
                <Ionicons name="flash-outline" size={15} color={theme.colors.primary} />
                <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                  {typeChipLabel}
                </Text>
              </View>
              <View
                className="flex-1 flex-row items-center rounded-xl px-3 py-2"
                style={panelStyle(isDark)}
              >
                <Ionicons name="document-text-outline" size={15} color={theme.colors.primary} />
                <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                  {bookingCode}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View className="flex-row items-center gap-2">
                <View
                  className="flex-1 flex-row items-center rounded-xl px-3 py-2"
                  style={panelStyle(isDark)}
                >
                  <Ionicons name="calendar-outline" size={15} color={theme.colors.primary} />
                  <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                    {typeChipLabel}
                  </Text>
                </View>
                <View
                  className="flex-1 flex-row items-center rounded-xl px-3 py-2"
                  style={panelStyle(isDark)}
                >
                  <Ionicons name="time-outline" size={15} color={theme.colors.primary} />
                  <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                    {scheduledDateTime}
                  </Text>
                </View>
              </View>
              <View
                className="flex-row items-center rounded-xl px-3 py-2"
                style={panelStyle(isDark)}
              >
                <Ionicons name="document-text-outline" size={15} color={theme.colors.primary} />
                <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                  {bookingCode}
                </Text>
              </View>
            </>
          )}
        </View>

        <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 8 }}>
          <StatusInfoTile
            status={item.bookingStatus}
            type="booking"
            subtitle={APP_TEXT.main.bookings.cardBookingStatusLabel}
          />
          {inviteStatus ? (
            <StatusInfoTile
              status={inviteStatus}
              type="invite"
              subtitle={APP_TEXT.main.bookings.cardInviteStatusLabel}
            />
          ) : null}
        </View>

        <View
          className="my-3 h-px"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight }}
        />

        <View className="flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center overflow-hidden rounded-full"
            style={{
              backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmPanelLight,
            }}
          >
            {workerImageUrl ? (
              <AppImage source={{ uri: workerImageUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-sm font-bold text-primary">{workerInitial}</Text>
            )}
          </View>
          <View className="ml-3 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="shrink text-sm font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
                {workerName}
              </Text>
              <RatingBadge averageRating={workerAverageRating} />
            </View>
            <Text className="mt-0.5 text-[11px] text-baseDark/55 dark:text-white/70" numberOfLines={1}>
              {workerSubtitle}
            </Text>
          </View>
        </View>

        <View
          className="mt-3 rounded-xl border px-3 py-2.5"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : palette.light.card,
            borderStyle: 'dotted',
          }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[10px] font-semibold text-baseDark/50 dark:text-white/60">
                {APP_TEXT.main.bookings.cardTotalBillLabel}
              </Text>
              <Text className="mt-0.5 text-base font-extrabold text-baseDark dark:text-white">
                {amountLabel}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-[10px] font-semibold text-baseDark/50 dark:text-white/60">
                {APP_TEXT.main.bookings.cardPaymentStatusLabel}
              </Text>
              <View className="mt-0.5">
                {paymentStatus ? (
                  <StatusBadge
                    status={paymentStatus}
                    type="payment"
                    label={paymentStatusLabel ?? undefined}
                    iconName={getStatusTileIconName(paymentStatus)}
                  />
                ) : (
                  <Text className="text-sm font-extrabold text-baseDark dark:text-white">--</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const CUSTOMER_ONGOING_BOOKING_CARD_WIDTH = CARD_WIDTH;
