import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { WorkerJobListItem } from '@/types/jobs';
import {
  getWorkerJobAddressLabel,
  getWorkerJobBookingAmountLabel,
  getWorkerJobCustomerInitial,
  getWorkerJobCustomerName,
  getWorkerJobPayoutAmountLabel,
  getWorkerJobReferenceLabel,
  getWorkerJobScheduleLabel,
} from '@/utils/worker-jobs';
import { formatTitle } from '@/utils';
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
  const bookingAmountLabel = getWorkerJobBookingAmountLabel(item);
  const payoutAmountLabel = getWorkerJobPayoutAmountLabel(item);
  const jobId = item.booking.id;
  const inviteStatus = item.invite?.inviteStatus ?? 'NEW_JOB_REQUEST';
  const inviteStatusLabel = formatTitle(inviteStatus);

  return (
    <View
      className="mb-4 overflow-hidden rounded-3xl border"
      style={{
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight,
        borderTopWidth: 4,
        borderTopColor: theme.colors.primary,
      }}
    >
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-lg font-bold text-baseDark dark:text-white">{subCategoryName}</Text>
            <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
              {(item.services || []).map((service) => (
                <StatusBadge key={service.id} status="COMPLETED" label={formatTitle(service.serviceName ?? undefined)} showDot={false} />
              ))}
            </View>
          </View>
          <StatusBadge status={inviteStatus} label={inviteStatusLabel} showDot={false} />
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
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text className="ml-2 flex-1 text-sm font-medium text-baseDark dark:text-white">{addressLabel}</Text>
          </View>
        </View>

        <View className="my-4 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight }} />

        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.warmPanelLight }}
            >
              <Text className="text-sm font-bold text-primary">{customerInitial}</Text>
            </View>
            <View className="ml-2.5 flex-1">
              <Text className="text-base font-semibold text-baseDark dark:text-white" numberOfLines={1}>
                {customerName}
              </Text>
              <Text className="text-xs text-baseDark/55 dark:text-white/70" numberOfLines={1}>
                Customer
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="wallet-outline" size={14} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
              <Text className="ml-1.5 text-sm font-extrabold text-baseDark dark:text-white">{bookingAmountLabel}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={14} color={theme.colors.positive} />
              <Text className="ml-1.5 text-lg font-extrabold" style={{ color: theme.colors.positive }}>{payoutAmountLabel}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => onPress(jobId)}
          className="mt-4 items-center justify-center rounded-2xl py-3.5"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="text-base font-bold text-white">View Job</Text>
        </Pressable>
      </View>
    </View>
  );
}
