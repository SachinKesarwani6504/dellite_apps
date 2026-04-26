import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import { palette, theme, uiColors } from '@/utils/theme';

type NearbyJobCardProps = {
  title: string;
  city?: string;
  distanceKm?: number;
  payoutLabel: string;
  imageUrl?: string;
  isDark: boolean;
  onPress?: () => void;
};

export function NearbyJobCard({
  title,
  city,
  distanceKm,
  payoutLabel,
  imageUrl,
  isDark,
  onPress,
}: NearbyJobCardProps) {
  const locationLabel = city
    ? (typeof distanceKm === 'number' ? `${city} · ${distanceKm.toFixed(1)} km` : city)
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="h-[84px] w-[84px] overflow-hidden"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
        >
          {imageUrl ? (
            <AppImage source={{ uri: imageUrl }} resizeMode="cover" className="h-full w-full" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-primary/10">
              <Ionicons name="briefcase-outline" size={18} color={theme.colors.primary} />
            </View>
          )}
        </View>
        <View className="flex-1 px-3 py-2.5">
          <Text className="text-base font-bold text-baseDark dark:text-white">{title}</Text>
          {locationLabel ? (
            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {locationLabel}
            </Text>
          ) : null}
          <Text className="mt-2 text-xs font-semibold text-primary">{payoutLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}
