import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { WorkerCurrentStatus } from '@/types/auth';
import { titleCase } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type WorkerCurrentStatusBannerProps = {
  currentStatus?: WorkerCurrentStatus | null;
};

function resolveStatusTone(status?: string) {
  const normalized = String(status ?? '').trim().toUpperCase();
  if (normalized === 'APPROVED') {
    return { label: 'Approved', color: theme.colors.positive, icon: 'checkmark-circle-outline' as const };
  }
  if (normalized === 'REJECTED') {
    return { label: 'Rejected', color: theme.colors.negative, icon: 'close-circle-outline' as const };
  }
  if (normalized === 'PENDING_APPROVAL' || normalized === 'PENDING') {
    return { label: 'Pending Approval', color: theme.colors.caution, icon: 'time-outline' as const };
  }
  return {
    label: normalized ? titleCase(normalized.replace(/_/g, ' ')) : 'Status',
    color: theme.colors.primary,
    icon: 'information-circle-outline' as const,
  };
}

export function WorkerCurrentStatusBanner({ currentStatus }: WorkerCurrentStatusBannerProps) {
  const isDark = useColorScheme() === 'dark';
  if (!currentStatus) return null;

  const tone = resolveStatusTone(currentStatus.status);
  const message = typeof currentStatus.message === 'string' && currentStatus.message.trim().length > 0
    ? currentStatus.message.trim()
    : 'Status updated.';

  return (
    <View
      className="mt-4 rounded-2xl border px-4 py-3"
      style={{
        borderColor: tone.color,
        backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
      }}
    >
      <View className="flex-row items-start">
        <View className="mr-2 mt-0.5 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
          <Ionicons name={tone.icon} size={16} color={tone.color} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
            Current Status
          </Text>
          <Text className="mt-1 text-sm font-semibold" style={{ color: tone.color }}>
            {tone.label}
          </Text>
          <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
}
