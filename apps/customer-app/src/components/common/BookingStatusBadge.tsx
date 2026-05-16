import React from 'react';
import { View, Text } from 'react-native';
import type { BookingStatus } from '@/types/api';
import { BOOKING_STATUS } from '@/types/booking';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  let containerClass = 'bg-yellow-100 dark:bg-yellow-900/30';
  let textClass = 'text-yellow-800 dark:text-yellow-400';

  switch (status) {
    case BOOKING_STATUS.COMPLETED:
      containerClass = 'bg-green-100 dark:bg-green-900/30';
      textClass = 'text-green-800 dark:text-green-400';
      break;
    case BOOKING_STATUS.CANCELLED:
    case BOOKING_STATUS.EXPIRED:
      containerClass = 'bg-red-100 dark:bg-red-900/30';
      textClass = 'text-red-800 dark:text-red-400';
      break;
    case BOOKING_STATUS.IN_PROGRESS:
    case BOOKING_STATUS.CONFIRMED:
      containerClass = 'bg-blue-100 dark:bg-blue-900/30';
      textClass = 'text-blue-800 dark:text-blue-400';
      break;
  }

  return (
    <View className={`self-start px-2 py-1 rounded-md ${containerClass}`}>
      <Text className={`text-xs font-bold ${textClass}`}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}