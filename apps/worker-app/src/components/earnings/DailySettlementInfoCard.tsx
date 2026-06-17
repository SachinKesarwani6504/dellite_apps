import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { DailySettlementInfoCardProps } from '@/types/worker-finance';
import { theme, uiColors } from '@/utils/theme';

export function DailySettlementInfoCard({ settlementInfo }: DailySettlementInfoCardProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="mt-4 flex-row items-start rounded-2xl border p-4"
      style={{
        borderColor: isDark ? uiColors.surface.overlayDark14 : theme.colors.stroke,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.noticeWarmLight,
      }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row flex-wrap items-center">
          <Text className="mr-2 text-base font-extrabold text-baseDark dark:text-white">
            {settlementInfo.title}
          </Text>
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}>
            <Text className="text-[10px] font-extrabold text-primary">
              {settlementInfo.badge}
            </Text>
          </View>
        </View>
        <Text className="mt-2 text-xs leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {settlementInfo.description}
        </Text>
      </View>
    </View>
  );
}
