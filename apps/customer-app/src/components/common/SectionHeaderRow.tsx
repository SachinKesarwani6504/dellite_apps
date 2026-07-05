import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { LivePulseIndicator } from '@/components/common/LivePulseIndicator';
import type { SectionHeaderRowProps } from '@/types/component-types';
import { theme } from '@/utils/theme';

export function SectionHeaderRow({
  title,
  onPressAction,
  actionIconName = 'chevron-forward',
  showLiveIndicator = false,
}: SectionHeaderRowProps) {
  const isDark = useColorScheme() === 'dark';
  void isDark;

  return (
    <View className="flex-row items-center justify-between">
      <Text className="flex-1 text-lg font-bold text-baseDark dark:text-white">{title}</Text>
      {showLiveIndicator || onPressAction ? (
        <View className="flex-row items-center">
          {showLiveIndicator ? <LivePulseIndicator size="compact" /> : null}
          {onPressAction ? (
            <Pressable
              onPress={onPressAction}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full"
            >
              <Ionicons name={actionIconName} size={18} color={theme.colors.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
