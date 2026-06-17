import { View } from 'react-native';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { BookingHistoryTimeline } from '@/components/common/BookingHistoryTimeline';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { formatBookingDateTime, titleCaseBookingValue } from '@/utils/booking-details';
import { mapBookingHistoryTimelineItems } from '@/utils/history-timeline';

export function BookingDetailsHistoryTab() {
  const { details } = useBookingDetailsContext();
  if (!details) return null;

  const timelineItems = mapBookingHistoryTimelineItems(details.history ?? [], {
    formatTitle: titleCaseBookingValue,
    formatTimestamp: formatBookingDateTime,
  });

  if (timelineItems.length === 0) {
    return (
      <ListEmptyState
        containerClassName="mt-4"
        title="No timeline yet"
        description="Booking updates will appear here."
        icon="time-outline"
      />
    );
  }

  return (
    <View className="mt-4">
      <BookingHistoryTimeline items={timelineItems} />
    </View>
  );
}
