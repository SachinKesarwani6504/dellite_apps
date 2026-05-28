import { Text, View, useColorScheme } from 'react-native';
import { getWorkerStatusBadgeColors, theme, uiColors, workerStatusBadgeToneMap } from '@/utils/theme';

type StatusBadgeType = keyof typeof workerStatusBadgeToneMap;

type StatusBadgeProps = {
  status: StatusBadgeType;
  label?: string;
  dotColor?: string;
  showDot?: boolean;
};

const STATUS_LABELS: Record<StatusBadgeType, string> = {
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  NEW_JOB_REQUEST: 'New Job Request',
  VIEWED: 'Viewed',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

export function StatusBadge({ status, label, dotColor, showDot = true }: StatusBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = getWorkerStatusBadgeColors(status, isDark);
  const textColor = isDark ? theme.colors.accent : colors.text;
  return (
    <View
      className="flex-row items-center rounded-full px-3 py-1"
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.status.subtleBorderLight,
      }}
    >
      {showDot ? (
        <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: dotColor ?? textColor }} />
      ) : null}
      <Text className="text-xs font-bold" style={{ color: textColor }}>
        {label ?? STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

export function getStatusBadgeTextColor(status: StatusBadgeType, isDark: boolean) {
  const colors = getWorkerStatusBadgeColors(status, isDark);
  return isDark ? theme.colors.accent : colors.text;
}
