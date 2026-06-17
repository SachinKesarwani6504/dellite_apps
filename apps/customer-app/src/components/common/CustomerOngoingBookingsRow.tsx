import { ScrollView, Text, View, useColorScheme } from 'react-native';

import { CustomerOngoingBookingCard, CUSTOMER_ONGOING_BOOKING_CARD_WIDTH } from '@/components/common/CustomerOngoingBookingCard';
import { SectionHeaderRow } from '@/components/common/SectionHeaderRow';
import type { CustomerOngoingBookingsRowProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { uiColors } from '@/utils/theme';

const CARD_GAP = 12;

export function CustomerOngoingBookingsRow({
  items,
  onPressBooking,
}: CustomerOngoingBookingsRowProps) {
  const isDark = useColorScheme() === 'dark';

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      <SectionHeaderRow title={APP_TEXT.main.homeOngoing.title} showLiveIndicator />
      <Text
        className="mt-1 text-xs leading-4"
        style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}
      >
        {APP_TEXT.main.homeOngoing.subtitle}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 12,
          paddingRight: 4,
          gap: CARD_GAP,
        }}
        snapToInterval={CUSTOMER_ONGOING_BOOKING_CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
      >
        {items.map(item => (
          <CustomerOngoingBookingCard
            key={item.id}
            item={item}
            onPress={onPressBooking}
          />
        ))}
      </ScrollView>
    </View>
  );
}
