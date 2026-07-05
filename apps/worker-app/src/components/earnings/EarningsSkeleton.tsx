import { View, useColorScheme } from 'react-native';
import { uiColors } from '@/utils/theme';

export function EarningsSkeleton() {
  const isDark = useColorScheme() === 'dark';
  const blockColor = isDark ? uiColors.surface.overlayDark10 : uiColors.surface.neutralSoftLight;
  const borderColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;

  return (
    <View className="mt-4 gap-3">
      <View className="h-44 rounded-3xl border" style={{ backgroundColor: blockColor, borderColor }} />
      <View className="flex-row flex-wrap justify-between" style={{ gap: 10 }}>
        <View className="h-36 rounded-2xl border" style={{ width: '48.5%', backgroundColor: blockColor, borderColor }} />
        <View className="h-36 rounded-2xl border" style={{ width: '48.5%', backgroundColor: blockColor, borderColor }} />
        <View className="h-36 rounded-2xl border" style={{ width: '48.5%', backgroundColor: blockColor, borderColor }} />
        <View className="h-36 rounded-2xl border" style={{ width: '48.5%', backgroundColor: blockColor, borderColor }} />
      </View>
      <View className="h-36 rounded-3xl border" style={{ backgroundColor: blockColor, borderColor }} />
      <View className="h-36 rounded-3xl border" style={{ backgroundColor: blockColor, borderColor }} />
    </View>
  );
}
