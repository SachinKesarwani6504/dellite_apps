import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AnimatedSegmentTabs } from '@/components/common/AnimatedSegmentTabs';
import { CustomerBookingCard } from '@/components/common/CustomerBookingCard';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { BOOKINGS_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { customerBookingTabs, customerMockBookings, CustomerBookingStatus } from '@/utils/options';

export function BookingsScreen() {
  const [activeStatus, setActiveStatus] = useState<CustomerBookingStatus>('ONGOING');
  const navigation = useNavigation() as any;
  const bookings = useMemo(() => customerMockBookings[activeStatus], [activeStatus]);

  return (
    <GradientScreen>
      <ScrollView className="flex-1 pt-1" contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <SplitGradientTitle
          prefix={APP_TEXT.main.bookings.titlePrefix}
          highlight={APP_TEXT.main.bookings.titleHighlight}
          subtitle={APP_TEXT.main.bookings.subtitle}
          inline
          prefixClassName="text-[34px] font-extrabold leading-[38px] text-baseDark dark:text-white"
          highlightClassName="text-[38px] font-extrabold leading-[41px]"
        />

        <AnimatedSegmentTabs items={customerBookingTabs} value={activeStatus} onChange={setActiveStatus} />

        <View className="mt-4">
          {bookings.map(item => (
            <CustomerBookingCard
              key={item.id}
              item={item}
              onPress={(bookingId) => navigation.navigate(BOOKINGS_SCREEN.DETAILS, { bookingId })}
            />
          ))}
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

