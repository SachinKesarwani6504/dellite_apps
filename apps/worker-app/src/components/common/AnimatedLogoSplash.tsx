import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useColorScheme } from 'react-native';

import type { AnimatedLogoSplashProps, GradientColors } from '@/types/animated-logo-splash';
import { palette, theme, uiColors } from '@/utils/theme';

const DEFAULT_LOGO = require('@/assets/images/png/dellite_logo.png');

function AnimatedLogoSplashComponent({
  logoSource = DEFAULT_LOGO,
  logoWidth = 140,
  onAnimationEnd,
}: AnimatedLogoSplashProps) {
  const isDark = useColorScheme() === 'dark';
  const intro = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const ringOne = useRef(new Animated.Value(0)).current;
  const ringTwo = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const introAnimation = Animated.timing(intro, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const breathAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const ringOneAnimation = Animated.loop(
      Animated.timing(ringOne, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    const ringTwoAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(420),
        Animated.timing(ringTwo, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    const orbitAnimation = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    introAnimation.start(() => {
      if (!cancelled) {
        onAnimationEnd?.();
      }
    });
    breathAnimation.start();
    ringOneAnimation.start();
    ringTwoAnimation.start();
    orbitAnimation.start();

    return () => {
      cancelled = true;
      introAnimation.stop();
      breathAnimation.stop();
      ringOneAnimation.stop();
      ringTwoAnimation.stop();
      orbitAnimation.stop();
      intro.stopAnimation();
      breath.stopAnimation();
      ringOne.stopAnimation();
      ringTwo.stopAnimation();
      orbit.stopAnimation();
    };
  }, [breath, intro, onAnimationEnd, orbit, ringOne, ringTwo]);

  const introScale = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });
  const introTranslateY = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const logoScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045],
  });
  const logoTranslateY = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const ringOneScale = ringOne.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.45],
  });
  const ringOneOpacity = ringOne.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, 0.26, 0],
  });
  const ringTwoScale = ringTwo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.6],
  });
  const ringTwoOpacity = ringTwo.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.18, 0],
  });
  const orbitRotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const gradientColors: GradientColors = isDark
    ? [palette.dark.background, uiColors.surface.cardElevatedDark, palette.dark.card]
    : [theme.colors.surfaceSoft, palette.light.background, uiColors.surface.warmSubtleLight];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.stage,
          {
            opacity: intro,
            transform: [
              { translateY: introTranslateY },
              { scale: introScale },
            ],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: ringOneOpacity,
              transform: [{ scale: ringOneScale }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            styles.ringSecondary,
            {
              opacity: ringTwoOpacity,
              transform: [{ scale: ringTwoScale }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.orbit,
            {
              transform: [{ rotate: orbitRotate }],
            },
          ]}
        >
          <View style={[styles.orbitDot, styles.orbitDotPrimary]} />
          <View style={[styles.orbitDot, styles.orbitDotSecondary]} />
        </Animated.View>
        <Animated.View
          style={[
            styles.logoFrame,
            {
              transform: [
                { translateY: logoTranslateY },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <Animated.Image
            source={logoSource}
            resizeMode="contain"
            style={[
              styles.logo,
              {
                width: logoWidth,
                height: logoWidth,
              },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

export const AnimatedLogoSplash = memo(AnimatedLogoSplashComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 170,
    height: 170,
    borderRadius: 85,
    marginLeft: -85,
    marginTop: -85,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ringSecondary: {
    borderColor: theme.colors.secondary,
    borderWidth: 1,
  },
  orbit: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 246,
    height: 246,
    borderRadius: 123,
    marginLeft: -123,
    marginTop: -123,
  },
  orbitDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  orbitDotPrimary: {
    top: 10,
    left: 118,
    backgroundColor: theme.colors.primary,
  },
  orbitDotSecondary: {
    bottom: 26,
    right: 44,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  logoFrame: {
    width: 184,
    height: 154,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    maxWidth: 162,
    maxHeight: 132,
  },
});
