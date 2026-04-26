import { Text, View, useColorScheme } from 'react-native';

import { GradientScreen } from '@/components/common/GradientScreen';
import { APP_TEXT } from '@/utils/appText';
import { palette, uiColors } from '@/utils';

export function OngoingScreen() {
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
          {APP_TEXT.main.allServicesTitle}
        </Text>
      </View>
    </GradientScreen>
  );
}

