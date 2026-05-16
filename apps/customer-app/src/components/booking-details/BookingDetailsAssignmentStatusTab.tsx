import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { getBookingDetailsTimelineItems } from '@/utils/booking-details';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingDetailsAssignmentStatusTab() {
  const isDark = useColorScheme() === 'dark';
  const { details } = useBookingDetailsContext();
  const timelineItems = getBookingDetailsTimelineItems(details);

  if (timelineItems.length === 0) {
    return (
      <View className="mt-5">
        <ListEmptyState
          title="No timeline updates yet"
          description="Booking updates will appear here as the job moves forward."
          icon="checkmark-done-outline"
        />
      </View>
    );
  }

  return (
    <View className="mt-5 gap-3">
      {timelineItems.map((item, index) => (
        <View
          key={item.key}
          className="flex-row rounded-2xl border p-4"
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
          }}
        >
          <View className="mr-3 items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}>
              <Ionicons name="checkmark-done-outline" size={16} color={theme.colors.primary} />
            </View>
            {index < timelineItems.length - 1 ? (
              <View className="mt-2 w-px flex-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-baseDark dark:text-white">{item.title}</Text>
            <Text className="mt-1 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>{item.subtitle}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
