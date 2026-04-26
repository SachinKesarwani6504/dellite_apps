import { Text, View, useColorScheme } from 'react-native';

import { GradientScreen } from '@/components/common/GradientScreen';
import { APP_TEXT } from '@/utils/appText';
import { palette, uiColors } from '@/utils/theme';

export function BookingsDetailsScreen({ route }: any) {
  const isDark = useColorScheme() === 'dark';
  return (
    <GradientScreen>
      <View className="flex-1 px-4 pt-20">
        <View
          className="rounded-2xl p-5"
          style={{
            backgroundColor: isDark ? palette.dark.card : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
          }}
        >
          <Text className="text-2xl font-extrabold text-baseDark dark:text-white">{APP_TEXT.main.bookings.detailsTitle}</Text>
          <Text className="mt-2 text-sm text-baseDark/70 dark:text-white/70">{APP_TEXT.main.bookings.detailsSubtitle}</Text>
          <View className="mt-5 rounded-xl px-3 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : '#F8FAFC' }}>
            <Text className="text-xs font-semibold text-baseDark/65 dark:text-white/70">Booking ID</Text>
            <Text className="mt-1 text-base font-bold text-primary">{route.params.bookingId}</Text>
          </View>
        </View>
      </View>
    </GradientScreen>
  );
}
