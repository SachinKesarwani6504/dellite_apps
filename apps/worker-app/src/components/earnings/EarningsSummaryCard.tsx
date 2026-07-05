import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { WorkerEarningsSummaryCardProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { formatInr, getWorkerEarningsGrowthTone } from '@/utils/worker-finance';
import { palette, theme, uiColors } from '@/utils/theme';

export function EarningsSummaryCard({
  summary,
  caption,
  showAveragePerJob = true,
  growthBadge,
}: WorkerEarningsSummaryCardProps) {
  const isDark = useColorScheme() === 'dark';
  const metricBackground = isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight90;
  const growthTone = growthBadge
    ? getWorkerEarningsGrowthTone(growthBadge.direction, isDark)
    : null;

  return (
    <View
      className="mt-4 overflow-hidden rounded-3xl border"
      style={{
        borderColor: isDark ? uiColors.surface.overlayDark14 : theme.colors.stroke,
        shadowColor: uiColors.shadow.warm,
        shadowOpacity: isDark ? 0 : 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={isDark ? [uiColors.surface.cardElevatedDark, uiColors.surface.cardMutedDark] : [theme.colors.surfaceSoft, palette.light.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-xs font-extrabold uppercase tracking-[1.4px]" style={{ color: theme.colors.primary }}>
              {APP_TEXT.earnings.netEarningsLabel}
            </Text>
            <Text className="mt-2 text-4xl font-black text-baseDark dark:text-white">
              {formatInr(summary.netEarnings)}
            </Text>
            <Text className="mt-1 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {caption ?? APP_TEXT.earnings.netEarningsCaption}
            </Text>
            {growthBadge && growthTone ? (
              <View
                className="mt-3 self-start flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: growthTone.backgroundColor }}
              >
                <Ionicons
                  name={growthTone.iconName as keyof typeof Ionicons.glyphMap}
                  size={13}
                  color={growthTone.textColor}
                  style={{ marginRight: 5 }}
                />
                <Text className="text-xs font-bold" style={{ color: growthTone.textColor }}>
                  {growthBadge.label}
                </Text>
              </View>
            ) : null}
          </View>
          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
          >
            <Ionicons name="wallet-outline" size={28} color={theme.colors.primary} />
          </View>
        </View>

        <View
          className="mt-5 flex-row rounded-2xl border"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: metricBackground,
          }}
        >
          <View className="flex-1 flex-row items-center px-4 py-3">
            <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
              <Ionicons name="briefcase-outline" size={16} color={theme.colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {APP_TEXT.earnings.completedJobsLabel}
              </Text>
              <Text className="mt-0.5 text-lg font-extrabold text-baseDark dark:text-white">
                {summary.completedJobs ?? 0}
              </Text>
            </View>
          </View>
          {showAveragePerJob ? (
            <>
              <View className="my-3 w-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
              <View className="flex-1 flex-row items-center px-4 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
                  <Ionicons name="trending-up-outline" size={16} color={theme.colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {APP_TEXT.earnings.averagePerJobLabel}
                  </Text>
                  <Text className="mt-0.5 text-lg font-extrabold text-baseDark dark:text-white">
                    {formatInr(summary.averageEarningPerJob)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}
