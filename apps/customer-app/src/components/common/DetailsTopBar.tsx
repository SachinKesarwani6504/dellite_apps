import { Pressable, Text, useColorScheme, View } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import type { DetailsTopBarProps } from '@/types/component-types';
import { theme, uiColors } from '@/utils/theme';

export function DetailsTopBar({
  onBack,
  onEdit,
  editLabel = 'Edit',
  editDisabled = false,
}: DetailsTopBarProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="mb-2 flex-row items-center justify-between">
      <BackButton onPress={onBack} />
      <Pressable
        onPress={onEdit}
        disabled={editDisabled}
        className="rounded-xl border px-4 py-2.5"
        style={{
          backgroundColor: isDark ? uiColors.surface.chipDark : uiColors.surface.overlayLight85,
          borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
          opacity: editDisabled ? 0.55 : 1,
        }}
      >
        <Text className="text-sm font-extrabold" style={{ color: theme.colors.primary }}>{editLabel}</Text>
      </Pressable>
    </View>
  );
}
