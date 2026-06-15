import type { ImageSourcePropType } from 'react-native';

export type GradientColors = readonly [string, string, string];

export type AnimatedLogoSplashProps = {
  logoSource?: ImageSourcePropType;
  logoWidth?: number;
  onAnimationEnd?: () => void;
};
