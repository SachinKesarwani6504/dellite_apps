import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Text, View, useColorScheme } from 'react-native';
import { palette, safeImageUrl, uiColors } from '@/utils';

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
  const resolvedImageUrl = safeImageUrl(imageUrl);

  return (
    <View
      className="overflow-hidden rounded-3xl border"
      style={{
        aspectRatio: 16 / 9,
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <ImageBackground
        source={resolvedImageUrl ? { uri: resolvedImageUrl, cache: 'force-cache' } : undefined}
        resizeMode="cover"
        className="h-full w-full"
      >
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
            <Text className="mt-1 text-sm font-medium text-white/90" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
