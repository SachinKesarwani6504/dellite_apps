import React from 'react';
import { View, Text } from 'react-native';
import type { BookingStatus } from '@/types/api';
import { getCustomerStatusBadgeColors } from '@/utils/theme';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const colors = getCustomerStatusBadgeColors(status, false);

  return (
    <View className="self-start rounded-md px-2 py-1" style={{ backgroundColor: colors.background }}>
      <Text className="text-xs font-bold" style={{ color: colors.text }}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}
