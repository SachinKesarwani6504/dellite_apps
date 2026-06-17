import { Pressable, Text, View, useColorScheme } from 'react-native';
import type { BookingOnlinePaymentOffersListProps } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { formatBookingMoney, hasBookingMoneyAmount } from '@/utils/booking-details';
import { theme, uiColors } from '@/utils/theme';

export function BookingOnlinePaymentOffersList({
  offers,
  selectedCouponCode,
  disabled = false,
  onSelectOffer,
}: BookingOnlinePaymentOffersListProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const dividerColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;

  if (offers.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-[1px]" style={{ color: mutedTextColor }}>
        {APP_TEXT.main.bookings.paymentOnlineOffersLabel}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {offers.map((offer) => {
          const isSelected = selectedCouponCode === offer.code;
          const offerDiscount = hasBookingMoneyAmount(offer.discountAmount)
            ? formatBookingMoney(offer.discountAmount)
            : null;

          return (
            <Pressable
              key={offer.discountId}
              disabled={disabled}
              onPress={() => onSelectOffer(offer.code)}
              className="rounded-full border px-3 py-1.5"
              style={{
                borderColor: isSelected ? theme.colors.primary : dividerColor,
                backgroundColor: isSelected
                  ? (isDark ? `${theme.colors.primary}22` : `${theme.colors.primary}12`)
                  : 'transparent',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: isSelected ? theme.colors.primary : undefined }}
              >
                {offer.title || offer.code}
                {offerDiscount ? ` · ${offerDiscount} off` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
