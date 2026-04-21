import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { titleCase } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type CityAvailabilityNoticeProps = {
  cityLabel?: string | null;
};

export function CityAvailabilityNotice({ cityLabel }: CityAvailabilityNoticeProps) {
  const isDark = useColorScheme() === 'dark';
  const cityText = cityLabel?.trim() ? titleCase(cityLabel) : 'your city';

  return (
    <View
      className="mt-4 flex-row rounded-2xl"
      style={{
        borderWidth: 1,
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: 4,
          backgroundColor: theme.colors.primary,
        }}
      />
      <View
        className="flex-1 px-4 py-4"
        style={{
          backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight90,
        }}
      >
        <View className="flex-row items-center">
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
          >
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
          </View>
          <Text className="ml-3 text-base font-extrabold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
            Not available in {cityText}
          </Text>
        </View>

        <Text className="mt-2 text-sm leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          We are expanding fast and will launch in your area soon.
        </Text>

        <View
          className="mt-3 self-start rounded-full px-3 py-1"
          style={{
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
          }}
        >
          <Text className="text-[11px] font-bold" style={{ color: theme.colors.primary }}>
            COMING SOON
          </Text>
        </View>
      </View>
    </View>
  );
}
