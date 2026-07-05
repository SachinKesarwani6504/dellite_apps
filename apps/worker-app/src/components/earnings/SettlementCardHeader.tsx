import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { SettlementStatusBadge } from '@/components/earnings/SettlementStatusBadge';
import type { SettlementCardHeaderProps } from '@/types/worker-finance';
import { theme, uiColors } from '@/utils/theme';

export function SettlementCardHeader({ displayDate, status, showStatus = false }: SettlementCardHeaderProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="flex-row items-center justify-between px-4 py-4"
      style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}
    >
      <View className="mr-3 flex-1 flex-row items-center">
        <Ionicons name="calendar-outline" size={21} color={theme.colors.primary} />
        <Text className="ml-2 text-base font-extrabold uppercase tracking-[2px] text-baseDark dark:text-white">
          {displayDate}
        </Text>
      </View>
      {showStatus ? <SettlementStatusBadge status={status} /> : null}
    </View>
  );
}
