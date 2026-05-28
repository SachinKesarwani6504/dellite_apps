import { Pressable, Text, View } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { palette, theme, uiColors } from '@/utils';

type SubcategorySelectionCardProps = {
  title: string;
  description?: string;
  imageUrl?: string | null;
  metaText?: string;
  badgeLabel?: string;
  isDark: boolean;
  selected?: boolean;
  onPress: () => void;
};

export function SubcategorySelectionCard({
  title,
  description,
  imageUrl,
  metaText,
  badgeLabel,
  isDark,
  selected = false,
  onPress,
}: SubcategorySelectionCardProps) {
  const shouldShowDescription = Boolean((description ?? '').trim().length > 0);

  return (
    <Pressable
      onPress={onPress}
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
        backgroundColor: selected ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
        height: 112,
      }}
    >
      {badgeLabel ? (
        <View className="absolute right-2 top-2 z-10">
          <StatusBadge status="CONFIRMED" label={badgeLabel} showDot={false} forceBlue forceBlueText />
        </View>
      ) : null}

      <View className="flex-row items-center">
        <View
          className="h-[112px] w-[104px] overflow-hidden"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
        >
          <AppImage source={imageUrl ? { uri: imageUrl } : undefined} resizeMode="cover" className="h-full w-full" />
        </View>
        <View className="flex-1 px-3 py-2.5 pr-24">
          <Text className={`text-[17px] font-extrabold ${selected ? 'text-primary' : 'text-baseDark dark:text-white'}`}>{title}</Text>
          {shouldShowDescription ? (
            <Text className="mt-1 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
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
