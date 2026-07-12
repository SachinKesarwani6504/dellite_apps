import { Pressable, Text, useColorScheme, View } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import type { DetailsTopBarProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

export function DetailsTopBar({
  onBack,
  title,
  onEdit,
  editLabel = APP_TEXT.common.edit,
  editDisabled = false,
}: DetailsTopBarProps) {
  const isDark = useColorScheme() === 'dark';
  const titleColor = isDark ? palette.dark.text : theme.colors.textPrimary;

  return (
    <View className="mb-2 flex-row items-center justify-between">
      <View className="min-w-0 flex-1 flex-row items-center">
        <BackButton onPress={onBack} />
        {title ? (
          <Text
            className="ml-2 flex-1 text-xl font-extrabold"
            style={{ color: titleColor }}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
      </View>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          disabled={editDisabled}
          className="ml-2 rounded-xl border px-4 py-2.5"
          style={{
            backgroundColor: isDark ? uiColors.surface.chipDark : uiColors.surface.overlayLight85,
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            opacity: editDisabled ? 0.55 : 1,
          }}
        >
          <Text className="text-sm font-extrabold" style={{ color: theme.colors.primary }}>{editLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
