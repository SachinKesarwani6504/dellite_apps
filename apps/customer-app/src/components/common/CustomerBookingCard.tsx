import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { StatusBadge } from '@/components/common/StatusBadge';
import type { CustomerBookingCardItem } from '@/utils/options';
import { palette, theme, uiColors } from '@/utils/theme';

type CustomerBookingCardProps = {
  item: CustomerBookingCardItem;
  onPress: (bookingId: string) => void;
};

export function CustomerBookingCard({ item, onPress }: CustomerBookingCardProps) {
  const isDark = useColorScheme() === 'dark';
  const workerInitial = item.workerName.trim().charAt(0).toUpperCase();

  return (
    <View
      className="mb-4 overflow-hidden rounded-3xl"
      style={{
        backgroundColor: isDark ? palette.dark.card : '#FFFFFF',
        borderWidth: 1,
        borderColor: isDark ? uiColors.surface.overlayDark14 : '#D1D5DB',
      }}
    >
      <View className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: item.accentColor }} />
      <Pressable onPress={() => onPress(item.id)} className="p-4 pl-5">
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-lg font-bold text-baseDark dark:text-white">{item.serviceTitle}</Text>
            <Text className="mt-1 text-sm text-baseDark/55 dark:text-white/70">{item.category}</Text>
          </View>
          <StatusBadge status={item.status} label={item.statusLabel} dotColor={item.accentColor} />
        </View>

        <View
          className="mt-3 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : '#F5EFEC' }}
        >
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text className="ml-2 text-sm font-medium text-baseDark dark:text-white">{item.slotLabel}</Text>
          </View>
        </View>

        <View
          className="mt-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : '#F5EFEC' }}
        >
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text className="ml-2 text-sm font-medium text-baseDark dark:text-white">{item.address}</Text>
          </View>
        </View>

        <View className="my-4 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : '#D1D5DB' }} />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : '#F6EFEA' }}
            >
              <Text className="text-sm font-bold text-primary">{workerInitial}</Text>
            </View>
            <View className="ml-2.5">
              <Text className="text-base font-semibold text-baseDark dark:text-white">{item.workerName}</Text>
              <Text className="text-xs text-baseDark/55 dark:text-white/70">Worker</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            {item.amountLabel ? <Text className="text-xl font-extrabold text-primary">{item.amountLabel}</Text> : null}
            <View
              className="ml-2 h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : '#F6EFEA' }}
            >
              <Ionicons name="call-outline" size={15} color={theme.colors.primary} />
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => onPress(item.id)}
          className="mt-4 items-center justify-center rounded-2xl py-3.5"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="text-base font-bold text-white">View Booking</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}
