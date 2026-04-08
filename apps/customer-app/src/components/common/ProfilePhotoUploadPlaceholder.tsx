import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { palette, theme, uiColors } from '@/utils/theme';

type ProfilePhotoUploadPlaceholderProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export function ProfilePhotoUploadPlaceholder({
  title,
  subtitle,
  onPress,
}: ProfilePhotoUploadPlaceholderProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="items-center">
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="h-24 w-24 items-center justify-center rounded-full border border-accent/45 bg-surfaceSoft"
        style={{
          backgroundColor: isDark ? uiColors.surface.avatarDark : theme.colors.surfaceSoft,
          shadowColor: uiColors.shadow.warm,
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          elevation: 4,
        }}
      >
        <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
          <Ionicons name="person-outline" size={28} color={theme.colors.primary} />
        </View>
        <View className="absolute bottom-1 right-1 h-7 w-7 items-center justify-center rounded-full border border-white bg-primary">
          <Ionicons name="camera-outline" size={14} color={theme.colors.onPrimary} />
        </View>
      </Pressable>
      <Text className="mt-3 text-sm font-semibold text-baseDark dark:text-white">{title}</Text>
      <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>{subtitle}</Text>
    </View>
  );
}
