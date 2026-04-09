import { ReactNode } from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle, useColorScheme } from 'react-native';
import { palette, uiColors } from '@/utils/theme';

type SectionCardProps = {
  title?: string;
  leftIcon?: ReactNode;
  rightContent?: ReactNode;
  children: ReactNode;
  containerClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  titleClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export function SectionCard({
  title,
  leftIcon,
  rightContent,
  children,
  containerClassName,
  headerClassName,
  bodyClassName,
  titleClassName,
  containerStyle,
  headerStyle,
  bodyStyle,
  titleStyle,
}: SectionCardProps) {
  const isDark = useColorScheme() === 'dark';
  const hasHeader = Boolean(title || leftIcon || rightContent);

  return (
    <View
      className={`overflow-hidden rounded-2xl border ${containerClassName ?? ''}`}
      style={[
        {
          backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
          borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        },
        containerStyle,
      ]}
    >
      {hasHeader ? (
        <View
          className={`flex-row items-center px-3 py-2 ${headerClassName ?? ''}`}
          style={[
            {
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight,
            },
            headerStyle,
          ]}
        >
          <View className="flex-1 flex-row items-center">
            {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
            {title ? (
              <Text
                className={`text-sm font-semibold text-baseDark dark:text-white ${titleClassName ?? ''}`}
                style={titleStyle}
              >
                {title}
              </Text>
            ) : null}
          </View>
          {rightContent}
        </View>
      ) : null}

      <View className={bodyClassName} style={bodyStyle}>
        {children}
      </View>
    </View>
  );
}
