import { Animated, Easing, View, useColorScheme } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import type { LivePulseIndicatorProps } from '@/types/component-types';
import { theme, uiColors } from '@/utils/theme';

const SIZE_CONFIG = {
  default: {
    container: 48,
    ring: 40,
    core: 40,
    dot: 10,
    ringScale: 1.85,
  },
  compact: {
    container: 32,
    ring: 26,
    core: 24,
    dot: 7,
    ringScale: 1.75,
  },
} as const;

export function LivePulseIndicator({ size = 'default' }: LivePulseIndicatorProps) {
  const isDark = useColorScheme() === 'dark';
  const pulse = useRef(new Animated.Value(0)).current;
  const dimensions = SIZE_CONFIG[size];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulse]);

  const ringStyle = useMemo(
    () => ({
      transform: [
        {
          scale: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, dimensions.ringScale],
          }),
        },
      ],
      opacity: pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.55, 0],
      }),
    }),
    [dimensions.ringScale, pulse],
  );

  const ringColor = theme.colors.primary;

  return (
    <View
      className="items-center justify-center"
      style={{ height: dimensions.container, width: dimensions.container }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            height: dimensions.ring,
            width: dimensions.ring,
            borderRadius: dimensions.ring / 2,
            borderWidth: 1.5,
            borderColor: ringColor,
            backgroundColor: 'transparent',
          },
          ringStyle,
        ]}
      />
      <View
        className="items-center justify-center rounded-full border"
        style={{
          height: dimensions.core,
          width: dimensions.core,
          borderColor: ringColor,
          backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
        }}
      >
        <View
          style={{
            height: dimensions.dot,
            width: dimensions.dot,
            borderRadius: dimensions.dot / 2,
            backgroundColor: ringColor,
          }}
        />
      </View>
    </View>
  );
}
