import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { palette } from '@/utils/theme';

type AnimatedLogoSplashProps = {
  logoSource?: ImageSourcePropType;
  logoWidth?: number;
  onAnimationEnd?: () => void;
};

const DEFAULT_LOGO = require('@/assets/icon.png');

function AnimatedLogoSplashComponent({
  logoSource = DEFAULT_LOGO,
  logoWidth = 140,
  onAnimationEnd,
}: AnimatedLogoSplashProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 180,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!cancelled) {
          onAnimationEnd?.();
        }
      });
    };

    run();

    return () => {
      cancelled = true;
      scale.stopAnimation();
    };
  }, [onAnimationEnd, scale]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={logoSource}
        resizeMode="contain"
        style={[
          styles.logo,
          {
            width: logoWidth,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

export const AnimatedLogoSplash = memo(AnimatedLogoSplashComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 140,
  },
});
