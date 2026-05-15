import Svg, { Circle, G, Path } from 'react-native-svg';
import type { WorkerLiveMarkerProps } from '@/types/component-types';
import { theme, uiColors } from '@/utils/theme';

export function WorkerLiveMarker({ headingDegrees }: WorkerLiveMarkerProps) {
  return (
    <Svg width={58} height={58} viewBox="0 0 58 58">
      <Circle cx="29" cy="29" r="27" fill={uiColors.live.blue} opacity="0.08" />
      <Circle cx="29" cy="29" r="22" fill="none" stroke={uiColors.live.blue} strokeOpacity="0.22" strokeWidth="2" strokeDasharray="5 5" />
      <Circle cx="29" cy="29" r="16" fill={uiColors.live.blue} opacity="0.16" />
      <G rotation={headingDegrees} origin="29,29">
        <Path d="M29 3L36 22L29 18L22 22L29 3Z" fill={uiColors.live.blue} />
        <Path d="M29 3L36 22L29 18L29 3Z" fill={uiColors.live.blueDark} opacity="0.35" />
      </G>
      <Circle cx="29" cy="29" r="12" fill={theme.colors.onPrimary} />
      <Circle cx="29" cy="29" r="9" fill={uiColors.live.blueMid} />
      <Circle cx="29" cy="29" r="5" fill={uiColors.live.blueSoft} />
    </Svg>
  );
}
