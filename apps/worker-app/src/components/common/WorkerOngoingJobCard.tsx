import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { AppImage } from '@/components/common/AppImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatusInfoTile } from '@/components/common/StatusInfoTile';
import type { WorkerOngoingJobCardProps } from '@/types/component-types';
import { formatTitle } from '@/utils';
import { getBookingPaymentStatusLabel } from '@/utils/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { getStatusBadgeTextColor, getStatusTileIconName } from '@/utils/status-badge';
import {
  getWorkerJobBookingAmountLabel,
  getWorkerJobCustomerInitial,
  getWorkerJobCustomerImageUrl,
  getWorkerJobCustomerName,
  getWorkerJobPayoutAmountLabel,
  getWorkerJobReferenceLabel,
  getWorkerJobScheduleLabel,
} from '@/utils/worker-jobs';
import { palette, theme, uiColors } from '@/utils/theme';

const CARD_WIDTH = 300;

const panelStyle = (isDark: boolean) => ({
  backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmCardLight,
});

export function WorkerOngoingJobCard({
  item,
  onPress,
}: WorkerOngoingJobCardProps) {
  const isDark = useColorScheme() === 'dark';
  const jobId = item.booking.id;
  const bookingStatus = item.booking.bookingStatus ?? 'CREATED';
  const inviteStatus = item.invite?.inviteStatus ?? 'NEW_JOB_REQUEST';
  const statusAccentColor = getStatusBadgeTextColor(bookingStatus, 'booking');
  const firstService = item.services?.[0];
  const subCategoryName = formatTitle(firstService?.subCategory?.trim() || 'Service');
  const bookingTypeLabel = item.booking.bookingType ? formatTitle(item.booking.bookingType) : 'Booking';
  const referenceLabel = getWorkerJobReferenceLabel(item);
  const scheduleLabel = item.booking.scheduledStartAt ? getWorkerJobScheduleLabel(item) : null;
  const isInstant = item.booking.bookingType === 'INSTANT';
  const customerName = getWorkerJobCustomerName(item);
  const customerInitial = getWorkerJobCustomerInitial(item);
  const customerImageUrl = getWorkerJobCustomerImageUrl(item);
  const bookingAmountLabel = getWorkerJobBookingAmountLabel(item);
  const payoutAmountLabel = getWorkerJobPayoutAmountLabel(item);
  const paymentStatus = item.booking.paymentStatus ?? null;
  const paymentStatusLabel = paymentStatus ? getBookingPaymentStatusLabel(paymentStatus) : null;
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
      onPress={() => onPress(jobId)}
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
            {subCategoryName}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
              {(item.services || []).slice(0, 2).map(service => (
                <StatusBadge
                  key={service.id ?? service.serviceName ?? 'service'}
                  status="COMPLETED"
                  label={formatTitle(service.serviceName ?? undefined)}
                  showDot={false}
                />
              ))}
              {(item.services?.length ?? 0) > 2 ? (
                <StatusBadge status="COMPLETED" label={`+${(item.services?.length ?? 0) - 2}`} showDot={false} />
              ) : null}
          </View>
        </View>

        <View className="mt-3 gap-2">
          {isInstant ? (
            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center rounded-xl px-3 py-2" style={panelStyle(isDark)}>
                <Ionicons name="flash-outline" size={15} color={theme.colors.primary} />
                <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                  {bookingTypeLabel}
                </Text>
              </View>
              <View className="flex-1 flex-row items-center rounded-xl px-3 py-2" style={panelStyle(isDark)}>
                <Ionicons name="document-text-outline" size={15} color={theme.colors.primary} />
                <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                  {referenceLabel}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 flex-row items-center rounded-xl px-3 py-2" style={panelStyle(isDark)}>
                  <Ionicons name="calendar-outline" size={15} color={theme.colors.primary} />
                  <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                    {bookingTypeLabel}
                  </Text>
                </View>
                <View className="flex-1 flex-row items-center rounded-xl px-3 py-2" style={panelStyle(isDark)}>
                  <Ionicons name="time-outline" size={15} color={theme.colors.primary} />
                  <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                    {scheduleLabel}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center rounded-xl px-3 py-2" style={panelStyle(isDark)}>
                <Ionicons name="document-text-outline" size={15} color={theme.colors.primary} />
                <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                  {referenceLabel}
                </Text>
              </View>
            </>
          )}
        </View>

        <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 8 }}>
          <StatusInfoTile status={bookingStatus} type="booking" subtitle={APP_TEXT.jobs.cardBookingStatusLabel} />
          <StatusInfoTile status={inviteStatus} type="invite" subtitle={APP_TEXT.jobs.cardInviteStatusLabel} />
        </View>

        <View
          className="my-3 h-px"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight }}
        />

        <View className="flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center overflow-hidden rounded-full"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmPanelLight }}
          >
            {customerImageUrl ? (
              <AppImage source={{ uri: customerImageUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-sm font-bold text-primary">{customerInitial}</Text>
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
              {customerName}
            </Text>
            <Text className="mt-0.5 text-[11px] text-baseDark/55 dark:text-white/70" numberOfLines={1}>
              Customer
            </Text>
          </View>
        </View>

        <View
          className="mt-3 rounded-xl border"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : palette.light.card,
            borderStyle: 'dotted',
          }}
        >
          <View className="flex-row items-center px-3 py-2.5">
            <View className="flex-1 flex-row items-center">
              <Ionicons name="wallet-outline" size={22} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
              <View className="ml-2.5">
                <Text className="text-[10px] text-baseDark/50 dark:text-white/60">{APP_TEXT.jobs.cardTotalBillLabel}</Text>
                <Text className="text-base font-extrabold text-baseDark dark:text-white">{bookingAmountLabel}</Text>
              </View>
            </View>
            <View className="mx-2.5 h-8 w-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
            <View className="flex-1 flex-row items-center">
              <Ionicons name="cash-outline" size={21} color={theme.colors.positive} />
              <View className="ml-2.5">
                <Text className="text-[10px] text-baseDark/50 dark:text-white/60">{APP_TEXT.jobs.cardWorkerEarningLabel}</Text>
                <Text className="text-base font-extrabold" style={{ color: theme.colors.positive }}>
                  {payoutAmountLabel === '--' ? APP_TEXT.jobs.payoutShownAfterRefresh : payoutAmountLabel}
                </Text>
              </View>
            </View>
          </View>
          {paymentStatus ? (
            <View className="border-t border-dashed px-3 py-2.5" style={{ borderTopColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="card-outline" size={18} color={theme.colors.primary} />
                  <Text className="ml-2 text-[11px] text-baseDark/60 dark:text-white/65">{APP_TEXT.jobs.cardPaymentStatusLabel}</Text>
                </View>
                <StatusBadge
                  status={paymentStatus}
                  type="payment"
                  label={paymentStatusLabel ?? undefined}
                  iconName={getStatusTileIconName(paymentStatus)}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const WORKER_ONGOING_JOB_CARD_WIDTH = CARD_WIDTH;
