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
  const createdAtText = typeof currentStatus.createdAt === 'string'
    ? currentStatus.createdAt
    : undefined;
  const formattedLastStatusAt = (() => {
    if (!createdAtText) return '';
    const parsed = new Date(createdAtText);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  })();

  return (
    <View
      className="mt-4 overflow-hidden rounded-ui-lg border"
      style={{
        borderColor: tone.color,
        backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
      }}
    >
      <View
        className="h-1.5"
        style={{
          backgroundColor: tone.color,
        }}
      />
      <View className="px-4 py-3">
        <View className="flex-row items-center">
          <View className="mr-3 flex-row items-center">
            <View
              className="mr-2 h-8 w-8 items-center justify-center rounded-ui-pill"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
            >
              <Ionicons name={tone.icon} size={17} color={tone.color} />
            </View>
            <View>
              <Text className="text-base font-semibold" style={{ color: tone.color }}>
                {tone.label}
              </Text>
            </View>
          </View>
        </View>
        <Text className="mt-2 text-sm leading-5" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
          {message}
        </Text>
        <View className="mt-2 flex-row justify-end">
          <Text className="text-[11px] font-semibold" style={{ color: tone.color }}>
            {formattedLastStatusAt || '-'}
          </Text>
        </View>
        <View className="mt-3 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />
        <View className="mt-2 flex-row items-center">
          <Ionicons name="information-circle-outline" size={14} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
          <Text className="ml-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            We will notify you when your status changes.
          </Text>
        </View>
      </View>
    </View>
  );
}
