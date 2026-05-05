import { View } from 'react-native';
import type { CardWrapperProps } from '@/types/component-types';
import { uiColors } from '@/utils/theme';

export function CardWrapper({
  isDark,
  lightBackgroundColor = '#FCFCFD',
  darkBackgroundColor = uiColors.surface.cardMutedDark,
  borderColor,
  withShadow = true,
  className = 'rounded-2xl border p-4',
  style,
  children,
  ...props
}: CardWrapperProps) {
  return (
    <View
      {...props}
      className={className}
      style={[
        {
          borderColor: borderColor ?? (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
          backgroundColor: isDark ? darkBackgroundColor : lightBackgroundColor,
          shadowColor: withShadow ? uiColors.shadow.base : 'transparent',
          shadowOpacity: withShadow ? (isDark ? 0.24 : 0.12) : 0,
          shadowRadius: withShadow ? 18 : 0,
          shadowOffset: { width: 0, height: 10 },
          elevation: withShadow ? 5 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
