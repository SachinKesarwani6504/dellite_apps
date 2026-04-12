import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { theme, uiColors } from '@/utils/theme';

type ListEmptyStateProps = {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  containerClassName?: string;
};

export function ListEmptyState({
  title,
  description,
  icon = 'list-outline',
  actionLabel,
  onAction,
  containerClassName = '',
}: ListEmptyStateProps) {
  const isDark = useColorScheme() === 'dark';
  const canShowAction = Boolean(actionLabel && onAction);

  return (
    <View
      className={`rounded-ui-md border px-4 py-5 ${containerClassName}`.trim()}
      style={{
        borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95,
      }}
    >
      <View className="items-center">
        <View
          className="h-10 w-10 items-center justify-center rounded-ui-pill"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
        >
          <Ionicons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text className="mt-2 text-sm font-semibold text-baseDark dark:text-white">{title}</Text>
        {description ? (
          <Text className="mt-1 text-center text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {description}
          </Text>
        ) : null}
        {canShowAction ? (
          <Pressable
            onPress={onAction}
            className="mt-3 rounded-full px-3 py-1.5"
            style={{ backgroundColor: uiColors.surface.accentSoft20 }}
          >
            <Text className="text-xs font-semibold text-primary">{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
