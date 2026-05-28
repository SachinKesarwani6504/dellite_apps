import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { LiveTrackingStatusCardProps } from '@/types/component-types';
import type { LiveTrackingIcon } from '@/types/live-tracking';
import { getLiveTrackingToneColors, getStatusToneColors, theme, uiColors } from '@/utils/theme';

function renderStatusIcon(icon: LiveTrackingIcon, color: string) {
  if (icon === 'bike') return <MaterialCommunityIcons name="motorbike" size={24} color={color} />;
  if (icon === 'walk') return <Ionicons name="walk-outline" size={24} color={color} />;
  if (icon === 'car') return <Ionicons name="car-sport-outline" size={24} color={color} />;
  if (icon === 'pause') return <Ionicons name="pause" size={24} color={color} />;
  if (icon === 'gpsWeak') return <Ionicons name="wifi-outline" size={24} color={color} />;
  if (icon === 'offline') return <MaterialCommunityIcons name="wifi-off" size={24} color={color} />;
  return <Ionicons name={icon === 'refresh' ? 'sync-outline' : 'navigate-outline'} size={24} color={color} />;
}

export function LiveTrackingStatusCard({
  card,
  isDark,
  liveBadgeText,
  error,
}: LiveTrackingStatusCardProps) {
  const toneColors = getLiveTrackingToneColors(card.tone, isDark);
  const liveBadgeColors = getStatusToneColors('success', isDark);

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95,
      }}
    >
      <View className="flex-row items-center px-4 py-4">
        <View
          className="mr-6 h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: toneColors.background }}
        >
          {renderStatusIcon(card.icon, toneColors.icon)}
        </View>
        <View className="flex-1 py-1">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-[18px] font-extrabold leading-6 text-baseDark dark:text-white">
              {card.title}
            </Text>
            {card.showLivePill ? (
              <View
                className="rounded-full px-4 py-1.5"
                style={{ backgroundColor: liveBadgeColors.background }}
              >
                <Text className="text-sm font-bold" style={{ color: liveBadgeColors.text }}>
                  {liveBadgeText}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="mt-2">
            <Text className="text-sm leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {card.subtitle}
            </Text>
          </View>
        </View>
      </View>
      {error ? (
        <Text className="px-3 pb-3 text-xs font-semibold" style={{ color: theme.colors.negative }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
