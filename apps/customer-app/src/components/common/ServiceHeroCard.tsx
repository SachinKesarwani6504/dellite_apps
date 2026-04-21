import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, Pressable, Text, View, useColorScheme } from 'react-native';
import { formatTitle, palette, theme, uiColors } from '@/utils';

type ServiceHeroCardProps = {
  title: string;
  imageUrl?: string | null;
  onPress: () => void;
  width?: number;
  height?: number;
  selected?: boolean;
  onImageError?: () => void;
};

export function ServiceHeroCard({
  title,
  imageUrl,
  onPress,
  width = 240,
  height = 176,
  selected = false,
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
      <ImageBackground
        source={imageUrl ? { uri: imageUrl, cache: 'force-cache' } : undefined}
        resizeMode="cover"
        style={{ flex: 1 }}
        onError={onImageError}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.74)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 12 }}
        >
          <Text className="text-base font-extrabold text-white">
            {formatTitle(title)}
          </Text>
        </LinearGradient>

        {selected ? (
          <View
            style={{
              position: 'absolute',
              right: 10,
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
      </ImageBackground>
    </Pressable>
  );
}
