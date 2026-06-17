import { View } from 'react-native';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { BookingHistoryTimeline } from '@/components/common/BookingHistoryTimeline';
import type { BookingDetailsResponse } from '@/types/booking-details';
import { formatBookingDateTime, titleCaseBookingValue } from '@/utils/booking-details';
import { mapBookingHistoryTimelineItems } from '@/utils/history-timeline';

type BookingDetailsHistoryTabProps = {
  details: BookingDetailsResponse;
};

export function BookingDetailsHistoryTab({ details }: BookingDetailsHistoryTabProps) {
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
