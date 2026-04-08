import { Text, View, useColorScheme } from 'react-native';

import { GradientScreen } from '@/components/common/GradientScreen';
import { palette, uiColors } from '@/utils';

export function HomeScreen() {
  const isDark = useColorScheme() === 'dark';

  return (
    <GradientScreen>
      <View
        className="mt-16 p-6"
        style={{
          backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight90,
          borderRadius: 16,
        }}
      >
        <Text className="text-3xl font-extrabold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
          Home
        </Text>
      </View>
    </GradientScreen>
  );
}
