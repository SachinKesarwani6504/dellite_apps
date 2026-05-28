import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { AppImageBackground } from '@/components/common/AppImageBackground';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatTitle, palette, theme, uiColors } from '@/utils';

type ServiceHeroCardProps = {
  title: string;
  subtitle?: string | null;
  topRightPillLabel?: string | null;
  imageUrl?: string | null;
  onPress: () => void;
  width?: number;
  height?: number;
  selected?: boolean;
  selectedIndicatorPosition?: 'top-left' | 'top-right';
  onImageError?: () => void;
};

export function ServiceHeroCard({
  title,
  subtitle,
  topRightPillLabel,
  imageUrl,
  onPress,
  width = 224,
  height = 164,
  selected = false,
  selectedIndicatorPosition = 'top-right',
  onImageError,
}: ServiceHeroCardProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      className="overflow-hidden rounded-2xl border"
      style={{
        width,
        height,
        borderColor: selected
          ? theme.colors.primary
          : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
        backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card,
      }}
      onPress={onPress}
    >
      <AppImageBackground
        source={imageUrl ? { uri: imageUrl } : undefined}
        resizeMode="cover"
        style={{ flex: 1 }}
        onError={onImageError}
      >
        <LinearGradient
          colors={[uiColors.map.heroGradientStart, uiColors.map.heroGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 12 }}
        >
          <Text className="text-lg font-extrabold text-white">
            {formatTitle(title)}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-xs font-semibold text-white/90">
              {subtitle}
            </Text>
          ) : null}
        </LinearGradient>

        {selected ? (
          <View
            style={{
              position: 'absolute',
              right: selectedIndicatorPosition === 'top-right' ? 10 : undefined,
              left: selectedIndicatorPosition === 'top-left' ? 10 : undefined,
              top: 10,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: uiColors.surface.overlayLight90,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
          </View>
        ) : null}

        {topRightPillLabel ? (
          <View
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
            }}
          >
            <StatusBadge status="CONFIRMED" label={topRightPillLabel} showDot={false} forceBlue forceBlueText />
          </View>
        ) : null}
      </AppImageBackground>
    </Pressable>
  );
}
