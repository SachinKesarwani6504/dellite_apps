import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { BookingDetailsHistoryItem } from '@/types/booking-details';
import type { BookingHistoryTimelineItem, TimelineIoniconName } from '@/types/history';
import { getStatusTileIconName } from '@/utils/status-badge';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function readMetadataStatus(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;

  const keys = ['status', 'bookingStatus', 'assignmentStatus', 'inviteStatus', 'paymentStatus', 'eventType', 'type'];
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim().toUpperCase();
    }
  }

  return null;
}

function mapStatusTileIcon(tileIcon: string): IoniconName {
  if (tileIcon === 'close') return 'close-circle-outline';
  if (tileIcon === 'checkmark') return 'checkmark-circle-outline';
  return 'time-outline';
}

function readIconFromTitle(title: string): TimelineIoniconName | null {
  const normalized = title.trim().toUpperCase();

  if (normalized.includes('NEW JOB') || normalized.includes('NEW REQUEST')) return 'notifications-outline';
  if (normalized.includes('ACCEPT')) return 'checkmark-circle-outline';
  if (normalized.includes('REJECT') || normalized.includes('CANCEL')) return 'close-circle-outline';
  if (normalized.includes('ASSIGN') || normalized.includes('PROFESSIONAL')) return 'person-outline';
  if (normalized.includes('COMPLETE')) return 'checkmark-done-outline';
  if (normalized.includes('IN PROGRESS') || normalized.includes('STARTED') || normalized.includes('EN ROUTE') || normalized.includes('ARRIVED')) {
    return 'navigate-outline';
  }
  if (normalized.includes('PAYMENT') || normalized.includes('PAID')) return 'card-outline';
  if (normalized.includes('SEARCH') || normalized.includes('FINDING')) return 'search-outline';
  if (normalized.includes('CONFIRM')) return 'shield-checkmark-outline';
  if (normalized.includes('VIEWED')) return 'eye-outline';

  return null;
}

export function getBookingHistoryIconName(
  title: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
): TimelineIoniconName {
  const metadataStatus = readMetadataStatus(metadata);
  if (metadataStatus) {
    return mapStatusTileIcon(getStatusTileIconName(metadataStatus));
  }

  return readIconFromTitle(title ?? '') ?? 'time-outline';
}

type MapBookingHistoryTimelineItemsOptions = {
  formatTitle?: (title: string) => string;
  formatTimestamp?: (value: string) => string;
};

export function mapBookingHistoryTimelineItems(
  items: BookingDetailsHistoryItem[],
  options?: MapBookingHistoryTimelineItemsOptions,
): BookingHistoryTimelineItem[] {
  const formatTitle = options?.formatTitle ?? (value => value);
  const formatTimestamp = options?.formatTimestamp ?? (value => value);

  return items.map(item => ({
    id: item.id,
    title: formatTitle(item.title),
    subtitle: item.description,
    timestamp: formatTimestamp(item.createdAt),
    iconName: getBookingHistoryIconName(item.title, item.metadata),
  }));
}
