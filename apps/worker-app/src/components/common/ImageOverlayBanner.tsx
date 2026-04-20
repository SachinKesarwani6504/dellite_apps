import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Text, View, useColorScheme } from 'react-native';
import { palette, uiColors } from '@/utils/theme';

type ImageOverlayBannerProps = {
  imageUrl?: string | null;
  overline?: string;
  title: string;
  subtitle?: string;
  pillText?: string;
};

export function ImageOverlayBanner({
  imageUrl,
  overline,
  title,
  subtitle,
  pillText,
}: ImageOverlayBannerProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="overflow-hidden rounded-3xl border"
      style={{
        aspectRatio: 16 / 9,
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <ImageBackground source={imageUrl ? { uri: imageUrl } : undefined} resizeMode="cover" className="h-full w-full">
        <LinearGradient
          colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.82)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          className="h-full w-full justify-end px-4 py-4"
        >
          {pillText ? (
            <View className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1">
              <Text className="text-[11px] font-bold text-primary">{pillText}</Text>
            </View>
          ) : null}
          {overline ? (
            <Text className="text-xs font-semibold uppercase tracking-wider text-white/90">{overline}</Text>
          ) : null}
          <Text className="mt-1 text-2xl font-extrabold leading-7 text-white">{title}</Text>
          {subtitle ? (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="star" size={14} color="#22C55E" />
              <Text className="ml-1 text-sm font-semibold text-white">{subtitle}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
