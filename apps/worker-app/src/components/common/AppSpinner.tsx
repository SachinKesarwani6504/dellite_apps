import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { theme } from '@/utils/theme';

type AppSpinnerProps = Omit<ActivityIndicatorProps, 'color'> & {
  color?: string;
};

export function AppSpinner({ color = theme.colors.primary, size = 'small', ...props }: AppSpinnerProps) {
  return <ActivityIndicator color={color} size={size} {...props} />;
}
