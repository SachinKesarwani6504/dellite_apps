import { Text, View, useColorScheme } from 'react-native';
import { GradientScreen } from '@/components/common/GradientScreen';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

export function HelpSupportScreen() {
  const isDark = useColorScheme() === 'dark';
  return (
    <GradientScreen>
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.profile.helpSupport.title}</Text>
        <Text className="mt-3 text-textPrimary dark:text-white">{APP_TEXT.profile.helpSupport.subtitle}</Text>
      </View>
    </GradientScreen>
  );
}

