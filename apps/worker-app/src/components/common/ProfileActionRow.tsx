import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppSpinner } from '@/components/common/AppSpinner';
import { theme, uiColors } from '@/utils/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ProfileActionRowProps = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
  isDark: boolean;
  showDivider?: boolean;
  disabled?: boolean;
  iconColor?: string;
  iconBackgroundColor?: string;
  titleColor?: string;
  loading?: boolean;
};

export function ProfileActionRow({
  title,
  subtitle,
  icon,
  onPress,
  isDark,
  showDivider = false,
  disabled = false,
  iconColor = theme.colors.primary,
  iconBackgroundColor,
  titleColor,
  loading = false,
}: ProfileActionRowProps) {
  const resolvedIconBackgroundColor = iconBackgroundColor
    ?? (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20);
  const resolvedTitleColor = titleColor ?? (isDark ? theme.colors.onPrimary : theme.colors.baseDark);
  const dividerColor = isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight;

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="flex-row items-center px-4 py-4"
      >
        <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: resolvedIconBackgroundColor }}>
          {loading ? (
            <AppSpinner size="small" color={iconColor} />
          ) : (
            <Ionicons name={icon} size={18} color={iconColor} />
          )}
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold" style={{ color: resolvedTitleColor }}>{title}</Text>
          <Text className="text-xs text-textPrimary/70 dark:text-white/70">{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={isDark ? uiColors.text.subtitleDark : theme.colors.baseDark} />
      </Pressable>
      {showDivider ? (
        <View className="h-px" style={{ backgroundColor: dividerColor }} />
      ) : null}
    </>
  );
}
