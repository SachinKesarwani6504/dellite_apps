import LottieView from 'lottie-react-native';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { lottieRegistry } from '@/assets/lottie';
import type { LottieName } from '@/assets/lottie';

type LottieSource = ComponentProps<typeof LottieView>['source'];

type AppLottieProps = {
  name?: LottieName;
  source?: LottieSource;
  autoPlay?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppLottie({ name, source, autoPlay = true, loop = true, style }: AppLottieProps) {
  const resolvedSource = source ?? (name ? lottieRegistry[name] : undefined);
  if (!resolvedSource) return null;

  return <LottieView source={resolvedSource} autoPlay={autoPlay} loop={loop} style={style} />;
}
