import { PropsWithChildren, ReactNode } from 'react';
import { Platform, ScrollView, ScrollViewProps, StyleProp, View, ViewStyle, useColorScheme } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, theme, uiColors } from '@/utils/theme';

type GradientVariant = 'app' | 'hero' | 'cta';

type GradientScrollHandle = {
  scrollToEnd: (animated?: boolean) => void;
};

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
  keyboardAware?: boolean;
  keyboardVerticalOffset?: number;
  scrollRef?: (ref: GradientScrollHandle | null) => void;
  keyboardExtraScrollHeight?: number;
}>;

const FLOATING_TAB_BAR_SCROLL_SPACER = 112;

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
  keyboardAware = false,
  keyboardVerticalOffset = 0,
  scrollRef,
  keyboardExtraScrollHeight = 180,
}: GradientScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const resolvedUseGradient = variant ? true : useGradient;
  const resolvedGradientColors = variant ? theme.gradients[variant] : gradientColors;
  const bottomSafeSpacerHeight = stickyFooter ? 0 : FLOATING_TAB_BAR_SCROLL_SPACER + insets.bottom;
  const setKeyboardAwareScrollRef = (ref: { scrollToEnd: (animated?: boolean) => void } | null) => {
    scrollRef?.(ref ? { scrollToEnd: (animated = true) => ref.scrollToEnd(animated) } : null);
  };
  const setNativeScrollRef = (ref: ScrollView | null) => {
    scrollRef?.(ref ? { scrollToEnd: (animated = true) => ref.scrollToEnd({ animated }) } : null);
  };
  const sharedScrollProps = {
    className: 'flex-1',
    refreshControl,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
    keyboardDismissMode: Platform.OS === 'ios' ? 'interactive' as const : 'on-drag' as const,
    contentContainerStyle: [
      { padding: 16, paddingBottom: stickyFooter ? 132 : 16 },
      contentContainerStyle,
    ],
  };

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
      {keyboardAware ? (
        <KeyboardAwareScrollView
          {...sharedScrollProps}
          innerRef={setKeyboardAwareScrollRef}
          enableOnAndroid
          enableAutomaticScroll
          extraHeight={220}
          extraScrollHeight={keyboardExtraScrollHeight}
          keyboardOpeningTime={0}
        >
          {children}
          <View style={{ height: bottomSafeSpacerHeight }} />
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView {...sharedScrollProps} ref={setNativeScrollRef}>
          {children}
          <View style={{ height: bottomSafeSpacerHeight }} />
        </ScrollView>
      )}
      {stickyFooter ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-accent/30 px-4 pb-5 pt-3 dark:border-white/10"
          style={[
            {
              backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95,
              paddingBottom: Math.max(insets.bottom + 8, 20),
            },
            stickyFooterContainerStyle,
          ]}
        >
          {stickyFooter}
        </View>
      ) : null}
    </View>
  );
  void keyboardVerticalOffset;

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
