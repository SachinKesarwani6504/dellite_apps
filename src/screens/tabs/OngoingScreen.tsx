import { Text, View, useColorScheme } from 'react-native';
import { GradientScreen } from '@/components/common/GradientScreen';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

export function OngoingScreen() {
  const isDark = useColorScheme() === 'dark';
  return (
    <GradientScreen>
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.ongoing.title}</Text>
        <Text className="mt-2 text-textPrimary dark:text-white">
          {APP_TEXT.ongoing.subtitle}
        </Text>
      </View>
    </GradientScreen>
  );
}

