import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { theme } from '@/utils/theme';

type SectionHeaderRowProps = {
  title: string;
  onPressAction?: () => void;
  actionIconName?: 'chevron-forward' | 'arrow-forward' | 'ellipsis-horizontal';
};

export function SectionHeaderRow({
  title,
  onPressAction,
  actionIconName = 'chevron-forward',
}: SectionHeaderRowProps) {
  const isDark = useColorScheme() === 'dark';
  void isDark;

  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-bold text-baseDark dark:text-white">{title}</Text>
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
  );
}

