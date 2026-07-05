import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatusInfoTile } from '@/components/common/StatusInfoTile';
import type { WorkerJobListItem } from '@/types/jobs';
import {
  getWorkerJobAddressLabel,
  getWorkerJobBookingAmountLabel,
  getWorkerJobCustomerInitial,
  getWorkerJobCustomerImageUrl,
  getWorkerJobCustomerName,
  getWorkerJobPayoutAmountLabel,
  getWorkerJobReferenceLabel,
  getWorkerJobScheduleLabel,
} from '@/utils/worker-jobs';
import { APP_TEXT } from '@/utils/appText';
import { formatTitle } from '@/utils';
import { getBookingPaymentStatusLabel } from '@/utils/booking-details';
import { getStatusTileIconName } from '@/utils/status-badge';
import { palette, theme, uiColors } from '@/utils/theme';

type WorkerJobCardProps = {
  item: WorkerJobListItem;
  onPress: (jobId: string) => void;
};

export function WorkerJobCard({ item, onPress }: WorkerJobCardProps) {
  const isDark = useColorScheme() === 'dark';
  const firstService = item.services?.[0];
  const subCategoryName = formatTitle(firstService?.subCategory?.trim() || 'Service');
  const bookingTypeLabel = item.booking.bookingType ? formatTitle(item.booking.bookingType) : 'Booking';
  const referenceLabel = getWorkerJobReferenceLabel(item);
  const scheduleLabel = item.booking.scheduledStartAt ? getWorkerJobScheduleLabel(item) : null;
  const addressLabel = getWorkerJobAddressLabel(item);
  const customerName = getWorkerJobCustomerName(item);
  const customerInitial = getWorkerJobCustomerInitial(item);
  const customerImageUrl = getWorkerJobCustomerImageUrl(item);
  const bookingAmountLabel = getWorkerJobBookingAmountLabel(item);
  const payoutAmountLabel = getWorkerJobPayoutAmountLabel(item);
  const paymentStatus = item.booking.paymentStatus ?? null;
  const jobId = item.booking.id;
  const bookingStatus = item.booking.bookingStatus ?? 'CREATED';
  const inviteStatus = item.invite?.inviteStatus ?? 'NEW_JOB_REQUEST';
  const paymentStatusLabel = paymentStatus ? getBookingPaymentStatusLabel(paymentStatus) : null;

  return (
    <View
      className="mb-4 overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight,
        borderTopWidth: 4,
        borderTopColor: theme.colors.primary,
      }}
    >
      <View className="p-4">
        <View>
          <Text className="text-xl font-extrabold text-baseDark dark:text-white" numberOfLines={1}>{subCategoryName}</Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            {(item.services || []).slice(0, 2).map((service) => (
              <StatusBadge key={service.id ?? service.serviceName ?? 'service'} status="COMPLETED" label={formatTitle(service.serviceName ?? undefined)} showDot={false} />
            ))}
            {(item.services?.length ?? 0) > 2 ? (
              <StatusBadge status="COMPLETED" label={`+${(item.services?.length ?? 0) - 2}`} showDot={false} />
            ) : null}
          </View>
        </View>

        <View className="mt-3 gap-2">
          <View className="flex-row items-center gap-2">
            <View
              className="flex-1 flex-row items-center rounded-xl px-3 py-2.5"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmCardLight }}
            >
              <Ionicons name={item.booking.bookingType === 'INSTANT' ? 'flash-outline' : 'calendar-outline'} size={16} color={theme.colors.primary} />
              <Text className="ml-2 flex-1 text-sm font-medium text-baseDark dark:text-white" numberOfLines={1}>
                {bookingTypeLabel}
              </Text>
            </View>
            <View
              className="flex-1 flex-row items-center rounded-xl px-3 py-2.5"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmCardLight }}
            >
              <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
              <Text className="ml-2 flex-1 text-sm font-medium text-baseDark dark:text-white" numberOfLines={1}>
                {referenceLabel}
              </Text>
            </View>
          </View>
        </View>
        {scheduleLabel ? (
          <View
            className="mt-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmCardLight }}
          >
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text className="ml-2 text-sm font-medium text-baseDark dark:text-white">{scheduleLabel}</Text>
            </View>
          </View>
        ) : null}

        <View
          className="mt-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmCardLight }}
        >
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={26} color={theme.colors.primary} />
            <Text className="ml-3 flex-1 text-sm font-medium leading-5 text-baseDark dark:text-white" numberOfLines={3}>{addressLabel}</Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
          <StatusInfoTile status={bookingStatus} type="booking" subtitle={APP_TEXT.jobs.cardBookingStatusLabel} />
          <StatusInfoTile status={inviteStatus} type="invite" subtitle={APP_TEXT.jobs.cardInviteStatusLabel} />
        </View>

        <View className="my-4 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight }} />

        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="h-12 w-12 overflow-hidden items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmPanelLight }}
            >
              {customerImageUrl ? (
                <AppImage source={{ uri: customerImageUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Text className="text-base font-bold text-primary">{customerInitial}</Text>
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
                {customerName}
              </Text>
              <Text className="text-xs text-baseDark/55 dark:text-white/70" numberOfLines={1}>
                Customer
              </Text>
            </View>
          </View>
        </View>

          <View
            className="mt-4 rounded-xl border"
            style={{
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : palette.light.card,
              borderStyle: 'dotted',
            }}
          >
          <View className="flex-row items-center px-4 py-3">
            <View className="flex-1 flex-row items-center">
              <Ionicons name="wallet-outline" size={25} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
              <View className="ml-3">
                <Text className="text-[11px] text-baseDark/50 dark:text-white/60">{APP_TEXT.jobs.cardTotalBillLabel}</Text>
                <Text className="text-lg font-extrabold text-baseDark dark:text-white">{bookingAmountLabel}</Text>
              </View>
            </View>
            <View className="mx-3 h-9 w-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
            <View className="flex-1 flex-row items-center">
              <Ionicons name="cash-outline" size={24} color={theme.colors.positive} />
              <View className="ml-3">
                <Text className="text-[11px] text-baseDark/50 dark:text-white/60">{APP_TEXT.jobs.cardWorkerEarningLabel}</Text>
                <Text className="text-lg font-extrabold" style={{ color: theme.colors.positive }}>
                  {payoutAmountLabel === '--' ? APP_TEXT.jobs.payoutShownAfterRefresh : payoutAmountLabel}
                </Text>
              </View>
            </View>
          </View>
          {paymentStatus ? (
            <View className="border-t border-dashed px-4 py-3" style={{ borderTopColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                  <Text className="ml-2 text-xs text-baseDark/60 dark:text-white/65">{APP_TEXT.jobs.cardPaymentStatusLabel}</Text>
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

        <Pressable
          onPress={() => onPress(jobId)}
          className="mt-4 items-center justify-center rounded-xl py-3.5"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="text-base font-bold text-white">{APP_TEXT.jobs.cardViewAction}</Text>
        </Pressable>
      </View>
    </View>
  );
}
