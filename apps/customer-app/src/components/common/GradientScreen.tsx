import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, ScrollViewProps, StyleProp, View, ViewStyle, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, theme, uiColors } from '@/utils/theme';

type GradientVariant = 'app' | 'hero' | 'cta';

type GradientScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  useGradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  stickyFooter?: ReactNode;
  stickyFooterContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps['refreshControl'];
  variant?: GradientVariant;
  floatingBackground?: ReactNode;
  floatingBackgroundTopInset?: number;
}>;

export function GradientScreen({
  children,
  contentContainerStyle,
  useGradient = false,
  gradientColors = theme.gradients.app,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
  stickyFooter,
  stickyFooterContainerStyle,
  refreshControl,
  variant,
  floatingBackground,
  floatingBackgroundTopInset = 0,
}: GradientScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const resolvedUseGradient = variant ? true : useGradient;
  const resolvedGradientColors = variant ? theme.gradients[variant] : gradientColors;
  const content = (
    <View className="flex-1">
      {floatingBackground ? (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0"
          style={{ top: floatingBackgroundTopInset, bottom: 0 }}
        >
          {floatingBackground}
        </View>
      ) : null}
      <ScrollView
        className="flex-1"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { padding: 16, paddingBottom: stickyFooter ? 132 : 32 },
          contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
      {stickyFooter ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-accent/30 px-4 pb-5 pt-3 dark:border-white/10"
          style={[
            {
              backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95,
            },
            stickyFooterContainerStyle,
          ]}
        >
          {stickyFooter}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: isDark ? palette.dark.background : palette.light.background }}>
      {resolvedUseGradient ? (
        <LinearGradient
          colors={resolvedGradientColors}
          start={gradientStart}
          end={gradientEnd}
          style={{ flex: 1 }}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
