import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type TimelineIoniconName = ComponentProps<typeof Ionicons>['name'];

export type BookingHistoryTimelineItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  timestamp?: string | null;
  iconName: TimelineIoniconName;
};

export type BookingHistoryTimelineProps = {
  items: BookingHistoryTimelineItem[];
};

export type TimelineHistoryItemProps = {
  title: string;
  subtitle?: string | null;
  timestamp?: string | null;
  iconName?: TimelineIoniconName;
  isLast?: boolean;
};
