import { Text, View, useColorScheme } from 'react-native';
import { theme, uiColors } from '@/utils/theme';

type StatusBadgeType = 'ONGOING' | 'COMPLETED' | 'CANCELLED';

type StatusBadgeProps = {
  status: StatusBadgeType;
  label?: string;
  dotColor?: string;
};

const STATUS_LABELS: Record<StatusBadgeType, string> = {
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<StatusBadgeType, { light: string; dark: string; text: string }> = {
  ONGOING: { light: uiColors.status.successLight, dark: uiColors.status.successDark, text: uiColors.status.successText },
  COMPLETED: { light: uiColors.status.infoLight, dark: uiColors.status.infoDark, text: uiColors.status.infoText },
  CANCELLED: { light: uiColors.status.dangerLight, dark: uiColors.status.dangerDark, text: uiColors.status.dangerText },
};

export function StatusBadge({ status, label, dotColor }: StatusBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = STATUS_COLORS[status];
  const textColor = isDark ? theme.colors.accent : colors.text;
  return (
    <View
      className="flex-row items-center rounded-full px-3 py-1"
      style={{
        backgroundColor: isDark ? colors.dark : colors.light,
        borderWidth: 1,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.status.subtleBorderLight,
      }}
    >
      <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: dotColor ?? textColor }} />
      <Text className="text-xs font-bold" style={{ color: textColor }}>
        {label ?? STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

export function getStatusBadgeTextColor(status: StatusBadgeType, isDark: boolean) {
  const colors = STATUS_COLORS[status];
  return isDark ? theme.colors.accent : colors.text;
}
