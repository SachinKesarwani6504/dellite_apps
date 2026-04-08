import { Ionicons } from '@expo/vector-icons';
import type { TextStyle } from 'react-native';

type AppIconName = 'chevronRight' | 'chevronLeft' | 'refresh' | 'home' | 'ongoing' | 'bookings' | 'profile' | 'checkmarkCircle' | 'checkmarkCircleSolid' | 'checkmark' | 'card';

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: TextStyle;
};

const iconMap: Record<AppIconName, keyof typeof Ionicons.glyphMap> = {
  chevronRight: 'chevron-forward',
  chevronLeft: 'chevron-back',
  refresh: 'refresh',
  home: 'home-outline',
  ongoing: 'time-outline',
  bookings: 'calendar-outline',
  profile: 'person-outline',
  checkmarkCircle: 'checkmark-circle-outline',
  checkmarkCircleSolid: 'checkmark-circle',
  checkmark: 'checkmark',
  card: 'card-outline',
};

export function AppIcon({ name, size = 20, color, style }: AppIconProps) {
  return <Ionicons name={iconMap[name]} size={size} color={color} style={style} />;
}
