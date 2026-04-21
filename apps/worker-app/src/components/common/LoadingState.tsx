import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';
import { palette, theme, uiColors } from '@/utils/theme';

type LoadingStateProps = {
  minHeight?: number;
  message?: string;
  containerClassName?: string;
};

export function LoadingState({ minHeight = 260, message, containerClassName }: LoadingStateProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className={containerClassName ?? 'w-full'}
      style={{ minHeight }}
    >
      <View
        className="h-full w-full items-center justify-center rounded-2xl border px-4"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {message ? (
          <Text
            className="mt-3 text-sm font-semibold"
            style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
          >
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

