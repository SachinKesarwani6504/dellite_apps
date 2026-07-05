import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import type { WorkerEarningsPeriodFilterProps } from '@/types/worker-finance';
import {
  WORKER_EARNINGS_PERIOD_OPTIONS,
  getWorkerEarningsGrowthTone,
} from '@/utils/worker-finance';
import { theme, uiColors } from '@/utils/theme';

export function EarningsPeriodFilter({
  selectedPeriod,
  growthLabel,
  growthDirection,
  onSelectPeriod,
}: WorkerEarningsPeriodFilterProps) {
  const isDark = useColorScheme() === 'dark';
  const shouldShowGrowth = growthLabel != null && growthDirection != null;
  const growthTone = shouldShowGrowth
    ? getWorkerEarningsGrowthTone(growthDirection, isDark)
    : null;

  return (
    <View className="mt-4 gap-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {WORKER_EARNINGS_PERIOD_OPTIONS.map(option => {
          const isSelected = option.value === selectedPeriod;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelectPeriod(option.value)}
              className="flex-row items-center rounded-full border px-4 py-2"
              style={{
                borderColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight),
                backgroundColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95),
              }}
            >
              {option.iconName ? (
                <Ionicons
                  name={option.iconName as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={isSelected ? theme.colors.onPrimary : theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
              ) : null}
              <Text
                className="text-xs font-extrabold"
                style={{ color: isSelected ? theme.colors.onPrimary : (isDark ? theme.colors.onPrimary : theme.colors.baseDark) }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {shouldShowGrowth && growthTone ? (
        <View
          className="self-start flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: growthTone.backgroundColor }}
        >
          <Ionicons
            name={growthTone.iconName as keyof typeof Ionicons.glyphMap}
            size={13}
            color={growthTone.textColor}
            style={{ marginRight: 5 }}
          />
          <Text className="text-xs font-bold" style={{ color: growthTone.textColor }}>
            {growthLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
