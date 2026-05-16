import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, useColorScheme } from "react-native";

import { StatusBadge, getStatusBadgeTextColor } from "@/components/common/StatusBadge";
import type { CustomerBookingCardProps } from "@/types/component-types";
import { CUSTOMER_BOOKING_TYPE } from "@/types/booking";
import { formatTitle } from "@/utils";
import {
  getCustomerBookingAddressLabel,
  getCustomerBookingAmountLabel,
  getCustomerBookingCategoryLabel,
  getCustomerBookingReferenceLabel,
  getCustomerBookingScheduleLabel,
  getCustomerBookingServiceTitle,
  getCustomerBookingWorkerInitial,
  getCustomerBookingWorkerName,
  getCustomerBookingWorkerSubtitle,
} from "@/utils/customer-bookings";
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
  const workerSubtitle = getCustomerBookingWorkerSubtitle(item);
  const amountLabel = getCustomerBookingAmountLabel(item);
  const statusAccentColor = getStatusBadgeTextColor(item.bookingStatus);

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
      className="mb-4 overflow-hidden rounded-3xl border"
      style={{
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight,
        borderTopWidth: 4,
        borderTopColor: statusAccentColor,
      }}
    >
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-lg font-bold text-baseDark dark:text-white">
              {subcategoryName}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
              {(item.services || []).map((service) => (
                <View
                  key={service.id}
                  className="rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: isDark
                      ? uiColors.surface.overlayDark10
                      : uiColors.surface.accentSoft20,
                  }}
                >
                  <Text className="text-xs font-semibold text-primary">
                    {formatTitle(service.serviceName ?? undefined)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <StatusBadge status={item.bookingStatus} />
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
        {scheduledStartAtLabel && (
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
        )}
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
              size={16}
              color={theme.colors.primary}
            />
            <Text className="ml-2 text-sm font-medium text-baseDark dark:text-white">
              {addressLabel}
            </Text>
          </View>
        </View>

        <View
          className="my-4 h-px"
          style={{
            backgroundColor: isDark
              ? uiColors.surface.overlayDark14
              : uiColors.surface.borderNeutralLight,
          }}
        />

        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{
                backgroundColor: isDark
                  ? uiColors.surface.overlayDark95
                  : uiColors.surface.warmPanelLight,
              }}
            >
              <Text className="text-sm font-bold text-primary">
                {workerInitial}
              </Text>
            </View>
            <View className="ml-2.5 flex-1">
              <Text
                className="text-base font-semibold text-baseDark dark:text-white"
                numberOfLines={1}
              >
                {workerName}
              </Text>
              <Text
                className="text-xs text-baseDark/55 dark:text-white/70"
                numberOfLines={1}
              >
                {workerSubtitle}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xl font-extrabold text-primary">
              {amountLabel}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => onPress(item.id)}
          className="mt-4 items-center justify-center rounded-2xl py-3.5"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="text-base font-bold text-white">View Booking</Text>
        </Pressable>
      </View>
    </View>
  );
}
