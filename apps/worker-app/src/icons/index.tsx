import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { theme } from '@/utils/theme';

export const iconMap = {
  home: 'home',
  jobs: 'briefcase',
  earnings: 'wallet',
  profile: 'person',
  edit: 'create',
  payout: 'card',
  help: 'help-circle',
  logout: 'log-out',
  phone: 'call',
  otp: 'keypad',
  chevronRight: 'chevron-forward',
  refresh: 'refresh',
} as const satisfies Record<string, keyof typeof Ionicons.glyphMap>;

export type AppIconName = keyof typeof iconMap;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
} & Omit<ComponentProps<typeof Ionicons>, 'name' | 'size' | 'color'>;

export function AppIcon({ name, size = 22, color = theme.colors.textPrimary, ...props }: AppIconProps) {
  return <Ionicons name={iconMap[name]} size={size} color={color} {...props} />;
}
