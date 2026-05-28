import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { theme, uiColors } from '@/utils/theme';

type ListErrorStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  containerClassName?: string;
};

export function ListErrorState({
  title,
  description,
  actionLabel = 'Try Again',
  onAction,
  containerClassName = '',
}: ListErrorStateProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className={`rounded-ui-md border px-4 py-5 ${containerClassName}`.trim()}
      style={{
        borderColor: theme.colors.negative,
        backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
      }}
    >
      <View className="items-center">
        <View
          className="h-10 w-10 items-center justify-center rounded-ui-pill"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
        >
          <Ionicons name="alert-circle-outline" size={18} color={theme.colors.negative} />
        </View>
        <Text className="mt-2 text-sm font-semibold" style={{ color: theme.colors.negative }}>{title}</Text>
        {description ? (
          <Text className="mt-1 text-center text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {description}
          </Text>
        ) : null}
        {onAction ? (
          <Pressable
            onPress={onAction}
            className="mt-3 rounded-full px-3 py-1.5"
            style={{ backgroundColor: theme.colors.negative }}
          >
            <Text className="text-xs font-semibold" style={{ color: theme.colors.onPrimary }}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

