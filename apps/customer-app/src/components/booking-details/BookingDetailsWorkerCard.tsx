import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { APP_TEXT } from '@/utils/appText';
import { getBookingDetailsWorkerCardDisplay } from '@/utils/booking-details';
import { palette, uiColors } from '@/utils/theme';

export function BookingDetailsWorkerCard() {
  const isDark = useColorScheme() === 'dark';
  const { details } = useBookingDetailsContext();
  const worker = getBookingDetailsWorkerCardDisplay(details);
  const title = worker.name ?? APP_TEXT.main.bookings.detailsWorkerPending;
  const subtitle = worker.name
    ? APP_TEXT.main.bookings.detailsWorkerRole
    : APP_TEXT.main.bookings.detailsWorkerPendingSubtitle;

  return (
    <View
      className="mt-3 flex-row items-center rounded-2xl border px-4 py-3"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        shadowColor: uiColors.shadow.base,
        shadowOpacity: isDark ? 0 : 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.accentSoft20,
        }}
      >
        {worker.profileImageUrl ? (
          <AppImage
            source={{ uri: worker.profileImageUrl }}
            resizeMode="cover"
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        ) : (
          <Text className="text-base font-extrabold text-primary">{worker.initial}</Text>
        )}
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-base font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
          {title}
        </Text>
        <Text
          className="mt-0.5 text-xs font-semibold"
          numberOfLines={2}
          style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
        >
          {subtitle}
        </Text>
      </View>

    </View>
  );
}
