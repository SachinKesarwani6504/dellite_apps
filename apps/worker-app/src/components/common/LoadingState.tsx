import { ActivityIndicator, View } from 'react-native';
import { theme } from '@/utils/theme';

type LoadingStateProps = {
  minHeight?: number;
  message?: string;
  containerClassName?: string;
};

export function LoadingState({ minHeight = 260, message, containerClassName }: LoadingStateProps) {
  void message;

  return (
    <View
      className={containerClassName ?? 'w-full'}
      style={{ minHeight }}
    >
      <View
        className="h-full w-full items-center justify-center px-4"
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </View>
  );
}
