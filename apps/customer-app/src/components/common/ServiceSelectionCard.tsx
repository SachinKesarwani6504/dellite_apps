import { Image, Pressable, Text, View } from 'react-native';
import { palette, theme, uiColors } from '@/utils';

type ServiceSelectionCardProps = {
  title: string;
  description?: string;
  imageUrl?: string | null;
  metaText?: string;
  isDark: boolean;
  selected?: boolean;
  onPress: () => void;
};

export function ServiceSelectionCard({
  title,
  description,
  imageUrl,
  metaText,
  isDark,
  selected = false,
  onPress,
}: ServiceSelectionCardProps) {
  const normalizeText = (value?: string) => (value ?? '').trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description);
  const shouldShowDescription = Boolean(normalizedDescription && normalizedDescription !== normalizedTitle);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
        backgroundColor: selected ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
      }}
    >
      <View className="flex-row items-center">
        <View
          className="h-[84px] w-[84px] overflow-hidden"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl, cache: 'force-cache' }} resizeMode="cover" className="h-full w-full" />
          ) : (
            <View className="h-full w-full bg-primary/10" />
          )}
        </View>
        <View className="flex-1 px-3 py-2.5">
          <Text className={`text-base font-bold ${selected ? 'text-primary' : 'text-baseDark dark:text-white'}`}>{title}</Text>
          {shouldShowDescription ? (
            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {description}
            </Text>
          ) : null}
          {metaText ? (
            <Text className="mt-2 text-xs font-semibold text-primary">{metaText}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
