import { Text, View, useColorScheme } from 'react-native';

import { getCustomerStatusBadgeColors, uiColors } from '@/utils/theme';

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
  showDot?: boolean;
  forceBlue?: boolean;
  forceBlueText?: boolean;
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

export function StatusBadge({
  status,
  label,
  dotColor,
  showDot = true,
  forceBlue = false,
  forceBlueText = false,
}: StatusBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = forceBlue
    ? getCustomerStatusBadgeColors('CONFIRMED', isDark)
    : getCustomerStatusBadgeColors(status, isDark);
  const textColor = forceBlueText ? uiColors.status.infoText : colors.text;

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
        {label ?? STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

export function getStatusBadgeTextColor(status: StatusBadgeType | string) {
  return getCustomerStatusBadgeColors(status, false).text;
}
