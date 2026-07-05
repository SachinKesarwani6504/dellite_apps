import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { WorkerHomeNearbyJob } from '@/types/auth';
import { formatTitle } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

type WorkerNearbyGoldenJobCardProps = {
  item: WorkerHomeNearbyJob;
  isDark: boolean;
  onPress?: () => void;
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatInr(value: number | null) {
  if (value == null) return null;
  return `\u20B9${value.toLocaleString('en-IN')}`;
}

function formatSchedule(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WorkerNearbyGoldenJobCard({ item, isDark, onPress }: WorkerNearbyGoldenJobCardProps) {
  const firstService = item.services?.[0];
  const title = formatTitle(firstService?.subCategory ?? item.title ?? APP_TEXT.home.jobFallback);
  const imageUrl = firstService?.subcategoryCardImageUrl ?? item.imageUrl;
  const servicePills = (item.services ?? [])
    .map(service => formatTitle(service.serviceName))
    .filter((value): value is string => Boolean(value));
  const visibleServicePills = servicePills.slice(0, 2);
  const extraServiceCount = Math.max(0, servicePills.length - visibleServicePills.length);
  const bookingType = formatTitle(item.booking?.bookingType ?? APP_TEXT.home.nearbyJobCard.bookingTypeFallback);
  const scheduledStartAt = formatSchedule(item.booking?.scheduledStartAt);
  const addressLine = item.address?.addressLine1?.trim() || null;
  const totalAmount = toNumber(item.booking?.totalAmount);
  const payoutAmount = toNumber(item.booking?.workerPayoutAmount);
  const totalAmountLabel = formatInr(totalAmount);
  const payoutAmountLabel = formatInr(payoutAmount);

  return (
    <Pressable
      onPress={onPress}
      className="h-[124px] overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <View className="flex-row items-stretch">
        <View className="h-full w-[100px] overflow-hidden">
          {imageUrl ? (
            <AppImage source={{ uri: imageUrl }} resizeMode="cover" className="h-full w-full" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-primary/10">
              <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
            </View>
          )}
        </View>
        <View className="flex-1 justify-between px-3 py-2">
          <View className="flex-row items-center justify-between">
            <Text className="mr-2 flex-1 text-base font-extrabold text-baseDark dark:text-white" numberOfLines={1}>{title}</Text>
            <StatusBadge status="PENDING" label={bookingType} showDot={false} />
          </View>
          {addressLine ? (
            <Text className="mt-0.5 text-xs" numberOfLines={1} style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {addressLine}
            </Text>
          ) : null}

          {visibleServicePills.length > 0 ? (
            <View className="mt-1 flex-row items-center gap-1">
              {visibleServicePills.map((pill, index) => (
                <StatusBadge key={`${pill}-${index}`} status="COMPLETED" label={pill} showDot={false} />
              ))}
              {extraServiceCount > 0 ? (
                <StatusBadge status="COMPLETED" label={`+${extraServiceCount}`} showDot={false} />
              ) : null}
            </View>
          ) : null}

          {scheduledStartAt ? (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="time-outline" size={13} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
              <Text className="ml-1.5 text-[11px] font-semibold text-baseDark/70 dark:text-white/70">{scheduledStartAt}</Text>
            </View>
          ) : null}
          {totalAmountLabel || payoutAmountLabel ? (
            <View className="mt-0.5 flex-row items-center justify-between">
              {totalAmountLabel ? (
                <View className="flex-row items-center">
                  <Ionicons name="wallet-outline" size={13} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
                  <Text className="ml-1.5 text-xs font-semibold text-baseDark dark:text-white">{totalAmountLabel}</Text>
                </View>
              ) : <View />}
              {payoutAmountLabel ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="cash-outline" size={13} color={theme.colors.positive} />
                  <Text className="text-sm font-extrabold" style={{ color: theme.colors.positive }}>
                    {payoutAmountLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
