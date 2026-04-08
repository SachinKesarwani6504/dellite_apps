import LottieView from 'lottie-react-native';
import { StyleProp, ViewStyle } from 'react-native';
import { LottieName, lottieRegistry } from '@/animations';

type AppLottieProps = {
  name: LottieName;
  autoPlay?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppLottie({ name, autoPlay = true, loop = true, style }: AppLottieProps) {
  return <LottieView source={lottieRegistry[name]} autoPlay={autoPlay} loop={loop} style={style} />;
}
