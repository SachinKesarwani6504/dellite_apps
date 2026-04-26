import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, ImageSourcePropType, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

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
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Hide native splash only when our JS splash view is ready to animate.
        await SplashScreen.hideAsync();
      } catch {
        // No-op if splash is already hidden.
      }

      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
        ]),
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
        ]),
      ]).start(() => {
        if (!cancelled) {
          onAnimationEnd?.();
        }
      });
    };

    void run();

    return () => {
      cancelled = true;
      opacity.stopAnimation();
      scale.stopAnimation();
    };
  }, [onAnimationEnd, opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={logoSource}
        resizeMode="contain"
        style={[
          styles.logo,
          {
            width: logoWidth,
            opacity,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 140,
  },
});
