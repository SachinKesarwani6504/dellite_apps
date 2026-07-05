import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { TimelineHistoryItemProps } from '@/types/history';
import { LivePulseIndicator } from '@/components/common/LivePulseIndicator';
import { palette, theme, uiColors } from '@/utils/theme';

export function TimelineHistoryItem({ title, subtitle, timestamp, isLast = false }: TimelineHistoryItemProps) {
  const isDark = useColorScheme() === 'dark';
  const railColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;

  return (
    <View className="flex-row">
      <View className="w-[20%] items-center">
        <View
          className="absolute bottom-0 top-0 border-l"
          style={{
            borderLeftColor: railColor,
            borderStyle: 'dashed',
          }}
        />
        <View className="mt-4">
          {isLast ? (
            <LivePulseIndicator />
          ) : (
            <View
              className="h-9 w-9 items-center justify-center rounded-full border"
              style={{
                borderColor: railColor,
                backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
              }}
            >
              <Ionicons name="time-outline" size={15} color={theme.colors.primary} />
            </View>
          )}
        </View>
      </View>

      <View className="w-[80%] pb-3">
        <View
          className="rounded-2xl border p-4"
          style={{
            borderColor: railColor,
            backgroundColor: isDark ? palette.dark.card : palette.light.card,
            shadowColor: uiColors.shadow.base,
            shadowOpacity: isDark ? 0 : 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-base font-extrabold leading-6 text-baseDark dark:text-white">
              {title}
            </Text>
            {timestamp ? (
              <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {timestamp}
              </Text>
            ) : null}
          </View>
          {subtitle ? (
            <Text className="mt-1 text-sm leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
