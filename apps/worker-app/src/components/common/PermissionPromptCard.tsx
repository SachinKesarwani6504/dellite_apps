import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';

import { Button } from '@/components/common/Button';
import type { PermissionPromptCardProps, PermissionPromptTone } from '@/types/component-types';
import { palette, theme, uiColors } from '@/utils/theme';

const TONE_STYLES: Record<PermissionPromptTone, {
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor: string;
}> = {
  location: {
    iconName: 'location-outline',
    accentColor: theme.colors.primary,
  },
  notification: {
    iconName: 'notifications-outline',
    accentColor: theme.colors.secondary,
  },
};

export function PermissionPromptCard({
  tone,
  title,
  subtitle,
  actionLabel,
  onAction,
  loading = false,
  helperText,
  containerClassName = '',
}: PermissionPromptCardProps) {
  const isDark = useColorScheme() === 'dark';
  const toneStyles = TONE_STYLES[tone];
  const surfaceBackground = isDark ? uiColors.surface.cardMutedDark : palette.light.card;
  const accentBackground = isDark
    ? uiColors.surface.overlayDark10
    : tone === 'notification'
      ? uiColors.surface.overlayLight90
      : uiColors.surface.accentSoft20;

  return (
    <View
      className={`overflow-hidden rounded-2xl border ${containerClassName}`.trim()}
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: surfaceBackground,
        shadowColor: uiColors.shadow.base,
        shadowOpacity: isDark ? 0.18 : 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      }}
    >
      <View className="flex-row">
        <View style={{ width: 4, backgroundColor: toneStyles.accentColor }} />
        <View className="flex-1 px-4 py-4">
          <View className="flex-row items-start">
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: accentBackground }}
            >
              <Ionicons name={toneStyles.iconName} size={20} color={toneStyles.accentColor} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-extrabold text-baseDark dark:text-white">
                {title}
              </Text>
              <Text
                className="mt-1 text-sm leading-5"
                style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
              >
                {subtitle}
              </Text>
            </View>
          </View>

          <View className="mt-4">
            <Button
              label={actionLabel}
              onPress={() => {
                void Promise.resolve(onAction()).catch(() => {});
              }}
              loading={loading}
            />
          </View>

          {helperText ? (
            <Text
              className="mt-2 text-center text-[11px] leading-4"
              style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}
            >
              {helperText}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
