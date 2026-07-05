import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { WorkerEarningsStatCardProps } from '@/types/worker-finance';
import { formatInr } from '@/utils/worker-finance';
import { getWorkerEarningsStatTone } from '@/utils/worker-finance';
import { palette, uiColors } from '@/utils/theme';

export function EarningsStatCard({ item, footerText }: WorkerEarningsStatCardProps) {
  const isDark = useColorScheme() === 'dark';
  const tone = getWorkerEarningsStatTone(item.tone, isDark);

  return (
    <View
      className="rounded-2xl border p-4"
      style={{
        width: '48.5%',
        minHeight: 168,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        backgroundColor: isDark ? palette.dark.card : palette.light.card,
        shadowColor: uiColors.shadow.base,
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: tone.backgroundColor }}
      >
        <Ionicons name={item.iconName as keyof typeof Ionicons.glyphMap} size={18} color={tone.iconColor} />
      </View>
      <Text className="mt-3 text-xs font-bold uppercase leading-4" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }} numberOfLines={2}>
        {item.title}
      </Text>
      <Text className="mt-1 text-xl font-black text-baseDark dark:text-white">
        {formatInr(item.amount)}
      </Text>
      <Text className="mt-2 text-xs leading-4" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }} numberOfLines={3}>
        {item.helperText}
      </Text>
      {footerText ? (
        <Text className="mt-2 text-[10px] leading-4 font-semibold" style={{ color: uiColors.status.dangerText }} numberOfLines={3}>
          {footerText}
        </Text>
      ) : null}
    </View>
  );
}
