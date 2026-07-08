import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';

import { formatAverageRating } from '@/utils/rating';
import { theme, uiColors } from '@/utils/theme';

type RatingBadgeProps = {
  averageRating?: number | null;
  size?: 'compact' | 'pill';
};

export function RatingBadge({ averageRating, size = 'compact' }: RatingBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const ratingLabel = formatAverageRating(averageRating);

  if (!ratingLabel) {
    return null;
  }

  const isPill = size === 'pill';

  return (
    <View
      className={`flex-row items-center rounded-full border ${isPill ? 'px-3 py-1' : 'px-1.5 py-0.5'}`}
      style={{
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
      }}
    >
      <Ionicons name="star" size={isPill ? 13 : 10} color={theme.colors.accent} />
      <Text
        className={`${isPill ? 'ml-1 text-xs' : 'ml-0.5 text-[10px]'} font-extrabold`}
        style={{ color: theme.colors.accent }}
      >
        {ratingLabel}
      </Text>
    </View>
  );
}
