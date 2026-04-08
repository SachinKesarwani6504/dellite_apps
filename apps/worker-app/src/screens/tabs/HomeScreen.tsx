import { Text, View, useColorScheme } from 'react-native';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

export function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthContext();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <GradientScreen>
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.home.title}</Text>
        <Text className="mt-2 text-textPrimary dark:text-white">
          {APP_TEXT.home.welcomePrefix}
          {displayName || APP_TEXT.home.welcomeFallbackName}
          {APP_TEXT.home.welcomeSuffix}
        </Text>
        <Text className="mt-2 text-textPrimary dark:text-white">
          {APP_TEXT.home.subtitle}
        </Text>
      </View>
    </GradientScreen>
  );
}

