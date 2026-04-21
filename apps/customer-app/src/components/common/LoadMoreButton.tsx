import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, theme, uiColors } from '@/utils/theme';

type LoadMoreButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  containerClassName?: string;
};

export function LoadMoreButton({
  label,
  loading = false,
  disabled = false,
  onPress,
  containerClassName = '',
}: LoadMoreButtonProps) {
  const isDark = useColorScheme() === 'dark';
  const isDisabled = disabled;
  const isPressDisabled = disabled || loading;
  const textColor = isDisabled
    ? (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight)
    : theme.colors.onPrimary;
  const spinnerColor = isDisabled
    ? (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight)
    : theme.colors.onPrimary;

  return (
    <View className={`items-center ${containerClassName}`.trim()}>
      <Pressable
        disabled={isPressDisabled}
        onPress={onPress}
        className="overflow-hidden rounded-full border"
        style={{
          minWidth: 240,
          height: 44,
          borderColor: isDisabled
            ? (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.borderNeutralLight)
            : uiColors.surface.overlayStrokeLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
          opacity: isPressDisabled ? 0.8 : 1,
        }}
      >
        <LinearGradient
          // Keep the CTA gradient visible while loading (fixes white-on-white).
          colors={isDisabled ? [uiColors.surface.overlayLight90, uiColors.surface.overlayLight90] : theme.gradients.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 44,
            paddingHorizontal: 22,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={spinnerColor} />
          ) : null}
          <Text
            className="text-xs font-extrabold"
            style={{ color: textColor, marginLeft: loading ? 8 : 0 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
