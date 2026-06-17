import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import type { EarningsSettlementsHeaderProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';

export function EarningsSettlementsHeader({ onOpenFilter, selectedPeriodLabel }: EarningsSettlementsHeaderProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="mt-5 flex-row items-start justify-between">
      <Text className="flex-1 pr-3 text-lg font-black text-baseDark dark:text-white">
        {APP_TEXT.earnings.dailySettlementsTitle}
      </Text>
      <Pressable onPress={onOpenFilter} className="self-start">
        <View
          className="flex-row items-center rounded-full border px-3 py-1.5"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
          }}
        >
          <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
          <Text className="text-xs font-extrabold" style={{ color: theme.colors.primary }}>
            {selectedPeriodLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
        </View>
      </Pressable>
    </View>
  );
}
