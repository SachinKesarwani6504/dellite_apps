import { Pressable, useColorScheme } from 'react-native';

import { AppIcon } from '@/icons';
import { palette, theme, uiColors } from '@/utils/theme';

type BackButtonProps = {
  onPress: () => void;
  visible?: boolean;
  disabled?: boolean;
};

export function BackButton({ onPress, visible = true, disabled = false }: BackButtonProps) {
  const isDark = useColorScheme() === 'dark';
  if (!visible) return null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="h-10 w-10 items-center justify-center rounded-xl"
      style={{
        backgroundColor: isDark ? uiColors.surface.chipDark : uiColors.surface.overlayLight85,
        borderWidth: 1,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <AppIcon
        name="chevronRight"
        color={isDark ? palette.dark.text : theme.colors.baseDark}
        style={{ transform: [{ rotate: '180deg' }] }}
      />
    </Pressable>
  );
}
