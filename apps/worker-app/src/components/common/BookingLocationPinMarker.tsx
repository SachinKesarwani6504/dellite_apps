import { SvgXml } from 'react-native-svg';
import { homeMapPinSvg } from '@/utils/svgicons';

export function BookingLocationPinMarker() {
  return <SvgXml xml={homeMapPinSvg} width={54} height={54} />;
}
