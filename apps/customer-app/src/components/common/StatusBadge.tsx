import { Text, View, useColorScheme } from 'react-native';

import { uiColors } from '@/utils/theme';

export type StatusBadgeType =
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CREATED'
  | 'SEARCHING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'EXPIRED';

type StatusBadgeProps = {
  status: StatusBadgeType | string;
  label?: string;
  dotColor?: string;
};

const STATUS_LABELS: Record<string, string> = {
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  CREATED: 'Created',
  SEARCHING: 'Searching',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  EXPIRED: 'Expired',
};

const STATUS_COLORS: Record<string, { light: string; dark: string; text: string }> = {
  ONGOING: { light: uiColors.status.successLight, dark: uiColors.status.successDark, text: uiColors.status.successText },
  COMPLETED: { light: uiColors.status.successLight, dark: uiColors.status.successDark, text: uiColors.status.successText },
  CANCELLED: { light: uiColors.status.dangerLight, dark: uiColors.status.dangerDark, text: uiColors.status.dangerText },
  CREATED: { light: uiColors.status.warningLight, dark: uiColors.status.warningDark, text: uiColors.status.warningText },
  SEARCHING: { light: uiColors.status.warningLight, dark: uiColors.status.warningDark, text: uiColors.status.warningText },
  CONFIRMED: { light: uiColors.status.infoLight, dark: uiColors.status.infoDark, text: uiColors.status.infoText },
  IN_PROGRESS: { light: uiColors.status.infoLight, dark: uiColors.status.infoDark, text: uiColors.status.infoText },
  EXPIRED: { light: uiColors.status.dangerLight, dark: uiColors.status.dangerDark, text: uiColors.status.dangerText },
};

const DEFAULT_COLOR = { light: uiColors.status.neutralLight, dark: uiColors.status.neutralDark, text: uiColors.status.neutralText };

export function StatusBadge({ status, label, dotColor }: StatusBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = STATUS_COLORS[status] || DEFAULT_COLOR;
  const textColor = colors.text;

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
        {label ?? STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}
