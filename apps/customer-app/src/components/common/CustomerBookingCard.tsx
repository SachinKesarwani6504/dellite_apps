import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, useColorScheme } from "react-native";

import { AppImage } from "@/components/common/AppImage";
import { RatingBadge } from "@/components/common/RatingBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatusInfoTile } from "@/components/common/StatusInfoTile";
import type { CustomerBookingCardProps } from "@/types/component-types";
import { CUSTOMER_BOOKING_TYPE } from "@/types/booking";
import { formatTitle } from "@/utils";
import {
  getCustomerBookingAddressLabel,
  getCustomerBookingAmountLabel,
  getCustomerBookingWorkerImageUrl,
  getCustomerBookingWorkerAverageRating,
  getCustomerBookingReferenceLabel,
  getCustomerBookingScheduleLabel,
  getCustomerBookingWorkerInitial,
  getCustomerBookingWorkerName,
  getCustomerBookingWorkerSubtitle,
} from "@/utils/customer-bookings";
import { getBookingPaymentStatusLabel } from "@/utils/booking-details";
import { APP_TEXT } from "@/utils/appText";
import { getStatusBadgeTextColor, getStatusTileIconName } from "@/utils/status-badge";
import { palette, theme, uiColors } from "@/utils/theme";

export function CustomerBookingCard({
  item,
  onPress,
}: CustomerBookingCardProps) {
  const isDark = useColorScheme() === "dark";
  const referenceLabel = getCustomerBookingReferenceLabel(item);
  const addressLabel = getCustomerBookingAddressLabel(item);
  const workerName = getCustomerBookingWorkerName(item);
  const workerInitial = getCustomerBookingWorkerInitial(item);
  const workerImageUrl = getCustomerBookingWorkerImageUrl(item);
  const workerAverageRating = getCustomerBookingWorkerAverageRating(item);
  const workerSubtitle = getCustomerBookingWorkerSubtitle(item);
  const amountLabel = getCustomerBookingAmountLabel(item);
  const statusAccentColor = getStatusBadgeTextColor(item.bookingStatus, "booking");
  const inviteStatus = item.invite?.inviteStatus ?? null;
  const paymentStatus = item.paymentStatus ?? null;
  const paymentStatusLabel = paymentStatus ? getBookingPaymentStatusLabel(paymentStatus) : null;

  // Extract data safely from the new BookingListItem shape
  const firstService = item.services?.[0];
  const subcategoryName = formatTitle(
    firstService?.subCategory || "Subcategory",
  );
  const reference = item.bookingCode || referenceLabel;
  const bookingTypeLabel = item.bookingType
    ? formatTitle(item.bookingType)
    : "Booking";
  const scheduledStartAtLabel = item.scheduledStartAt
    ? getCustomerBookingScheduleLabel(item)
    : null;

  return (
    <View
      className="mb-4 overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight,
        borderTopWidth: 4,
        borderTopColor: statusAccentColor,
      }}
    >
      <View className="p-4">
        <View>
          <Text className="text-xl font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
            {subcategoryName}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            {(item.services || []).slice(0, 2).map((service) => (
              <StatusBadge key={service.id ?? service.serviceName ?? 'service'} status="CONFIRMED" label={formatTitle(service.serviceName ?? undefined)} showDot={false} />
            ))}
            {(item.services?.length ?? 0) > 2 ? (
              <StatusBadge status="CONFIRMED" label={`+${(item.services?.length ?? 0) - 2}`} showDot={false} />
            ) : null}
          </View>
        </View>

        <View className="mt-3 gap-2">
          <View className="flex-row items-center gap-2">
            <View
              className="flex-1 flex-row items-center rounded-xl px-3 py-2.5"
              style={{
                backgroundColor: isDark
                  ? uiColors.surface.overlayDark95
                  : uiColors.surface.warmCardLight,
              }}
            >
              <Ionicons
                name={
                  item.bookingType === CUSTOMER_BOOKING_TYPE.INSTANT
                    ? "flash-outline"
                    : "calendar-outline"
                }
                size={16}
                color={theme.colors.primary}
              />
              <Text
                className="ml-2 flex-1 text-sm font-medium text-baseDark dark:text-white"
                numberOfLines={1}
              >
                {bookingTypeLabel}
              </Text>
            </View>
            <View
              className="flex-1 flex-row items-center rounded-xl px-3 py-2.5"
              style={{
                backgroundColor: isDark
                  ? uiColors.surface.overlayDark95
                  : uiColors.surface.warmCardLight,
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                className="ml-2 flex-1 text-sm font-medium text-baseDark dark:text-white"
                numberOfLines={1}
              >
                {reference}
              </Text>
            </View>
          </View>
        </View>
        {scheduledStartAtLabel ? (
          <View
            className="mt-2 rounded-xl px-3 py-2.5"
            style={{
              backgroundColor: isDark
                ? uiColors.surface.overlayDark95
                : uiColors.surface.warmCardLight,
            }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text className="ml-2 text-sm font-medium text-baseDark dark:text-white">
                {scheduledStartAtLabel}
              </Text>
            </View>
          </View>
        ) : null}
        <View
          className="mt-2 rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: isDark
              ? uiColors.surface.overlayDark95
              : uiColors.surface.warmCardLight,
          }}
        >
          <View className="flex-row items-center">
            <Ionicons
              name="location-outline"
              size={26}
              color={theme.colors.primary}
            />
            <Text className="ml-3 flex-1 text-sm font-medium leading-5 text-baseDark dark:text-white" numberOfLines={3}>
              {addressLabel}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
          <StatusInfoTile status={item.bookingStatus} type="booking" subtitle={APP_TEXT.main.bookings.cardBookingStatusLabel} />
          {inviteStatus ? <StatusInfoTile status={inviteStatus} type="invite" subtitle={APP_TEXT.main.bookings.cardInviteStatusLabel} /> : null}
        </View>

        <View className="my-4 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight }} />

        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="h-12 w-12 overflow-hidden items-center justify-center rounded-full"
              style={{
                backgroundColor: isDark
                  ? uiColors.surface.overlayDark95
                  : uiColors.surface.warmPanelLight,
              }}
            >
              {workerImageUrl ? (
                <AppImage source={{ uri: workerImageUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Text className="text-base font-bold text-primary">
                  {workerInitial}
                </Text>
              )}
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="shrink text-base font-extrabold text-baseDark dark:text-white"
                  numberOfLines={1}
                >
                  {workerName}
                </Text>
                <RatingBadge averageRating={workerAverageRating} />
              </View>
              <Text
                className="mt-0.5 text-xs text-baseDark/55 dark:text-white/70"
                numberOfLines={1}
              >
                {workerSubtitle}
              </Text>
            </View>
          </View>
        </View>

        <View
          className="mt-4 rounded-xl border px-4 py-3"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : palette.light.card,
            borderStyle: 'dotted',
          }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold text-baseDark/50 dark:text-white/60">
                {APP_TEXT.main.bookings.cardTotalBillLabel}
              </Text>
              <Text className="mt-1 text-lg font-extrabold text-baseDark dark:text-white">{amountLabel}</Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-[11px] font-semibold text-baseDark/50 dark:text-white/60">
                {APP_TEXT.main.bookings.cardPaymentStatusLabel}
              </Text>
              <View className="mt-1">
                {paymentStatus ? (
                  <StatusBadge
                    status={paymentStatus}
                    type="payment"
                    label={paymentStatusLabel ?? undefined}
                    iconName={getStatusTileIconName(paymentStatus)}
                  />
                ) : (
                  <Text className="text-base font-extrabold text-baseDark dark:text-white">--</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => onPress(item.id)}
          className="mt-4 items-center justify-center rounded-xl py-3.5"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="text-base font-bold text-white">{APP_TEXT.main.bookings.cardViewAction}</Text>
        </Pressable>
      </View>
    </View>
  );
}
