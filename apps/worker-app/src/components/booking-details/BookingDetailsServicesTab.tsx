import { Text, View, useColorScheme } from 'react-native';
import { BookingServiceSummaryCard } from '@/components/common/BookingServiceSummaryCard';
import type { BookingDetailsResponse } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { getBookingDetailsServiceDisplay } from '@/utils/booking-details';
import { uiColors } from '@/utils/theme';

type BookingDetailsServicesTabProps = {
  details: BookingDetailsResponse;
};

export function BookingDetailsServicesTab({ details }: BookingDetailsServicesTabProps) {
  const isDark = useColorScheme() === 'dark';
  const serviceLines = details.serviceLines ?? [];

  return (
    <>
      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-xs font-extrabold uppercase text-baseDark dark:text-white">
          {APP_TEXT.jobs.serviceTabSelectedTitle}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {`${serviceLines.length} ${serviceLines.length === 1 ? 'item' : 'items'}`}
        </Text>
      </View>

      <View className="mt-3 gap-3">
        {serviceLines.map((line, index) => {
          const display = getBookingDetailsServiceDisplay(line);

          return (
            <BookingServiceSummaryCard
              key={display.key || `${line.serviceName}-${index}`}
              mode="VIEW"
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
