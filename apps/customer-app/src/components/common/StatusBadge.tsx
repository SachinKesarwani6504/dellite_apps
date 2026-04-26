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
  ONGOING: { light: '#ECFDF3', dark: 'rgba(22, 163, 74, 0.2)', text: '#15803D' },
  COMPLETED: { light: '#EEF2FF', dark: 'rgba(79, 70, 229, 0.22)', text: '#4F46E5' },
  CANCELLED: { light: '#FEF2F2', dark: 'rgba(239, 68, 68, 0.24)', text: '#DC2626' },
};

export function StatusBadge({ status, label, dotColor }: StatusBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = STATUS_COLORS[status];
  return (
    <View
      className="flex-row items-center rounded-full px-3 py-1"
      style={{
        backgroundColor: isDark ? colors.dark : colors.light,
        borderWidth: 1,
        borderColor: isDark ? uiColors.surface.overlayDark14 : 'rgba(17, 24, 39, 0.06)',
      }}
    >
      <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: dotColor ?? (isDark ? theme.colors.accent : colors.text) }} />
      <Text className="text-xs font-bold" style={{ color: isDark ? theme.colors.accent : colors.text }}>
        {label ?? STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
