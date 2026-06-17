import { Text, View, useColorScheme } from 'react-native';
import { BookingServiceSummaryCard } from '@/components/common/BookingServiceSummaryCard';
import { useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { BOOKING_SERVICE_SUMMARY_CARD_MODE } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { getBookingDetailsServiceDisplay } from '@/utils/booking-details';
import { uiColors } from '@/utils/theme';

export function BookingDetailsServicesTab() {
  const isDark = useColorScheme() === 'dark';
  const { details } = useBookingDetailsContext();
  if (!details) return null;

  return (
    <>
      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-xs font-extrabold uppercase text-baseDark dark:text-white">
          {APP_TEXT.main.bookingFlow.selectedServicesTitle}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {(details.serviceLines ?? []).length} {(details.serviceLines ?? []).length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View className="mt-3 gap-3">
        {(details.serviceLines ?? []).map(line => {
          const display = getBookingDetailsServiceDisplay(line);

          return (
            <BookingServiceSummaryCard
              key={display.key}
              mode={BOOKING_SERVICE_SUMMARY_CARD_MODE.VIEW}
              title={display.title}
              subtitle={display.subtitle}
              selectedValueLabel={display.selectedValueLabel}
              selectedValue={display.selectedValue}
              pricingTitle={display.pricingTitle}
              pricingValue={display.pricingValue}
              totalLabel={display.totalLabel}
            />
          );
        })}
      </View>
    </>
  );
}
