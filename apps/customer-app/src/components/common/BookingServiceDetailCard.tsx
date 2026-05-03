import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { ServicePricingHeaderCard } from '@/components/common/ServicePricingHeaderCard';
import { ServiceTasksCarousel } from '@/components/common/ServiceTasksCarousel';
import type { BookingServiceDetailCardProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { formatCurrencyAmount, formatPriceOptionMeta, formatSubtotalMultiplierLabel } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingServiceDetailCard({
  service,
  selectedPriceOption,
  selectedPriceOptionId,
  quantity,
  unitPriceAmount,
  lineTotalAmount,
  isDark,
  selectedDurationMinutes,
  onSelectPriceOption,
  onSelectDurationMinutes,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveService,
}: BookingServiceDetailCardProps) {
  const includedTasks = Array.isArray(service.includedTasks) ? service.includedTasks : [];
  const excludedTasks = Array.isArray(service.excludedTasks) ? service.excludedTasks : [];

  return (
    <View
      className="rounded-lg border p-4"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <View className="mb-1 flex-row justify-end">
        <Pressable
          onPress={onRemoveService}
          className="h-9 w-9 items-center justify-center rounded-full border"
          style={{
            backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayLight95,
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          }}
        >
          <Ionicons name="close" size={18} color={theme.colors.primary} />
        </Pressable>
      </View>

      <ServicePricingHeaderCard
        serviceName={service.name}
        selectedPriceOption={selectedPriceOption}
        priceOptions={Array.isArray(service.priceOptions) ? service.priceOptions : []}
        selectedPriceOptionId={selectedPriceOptionId}
        quantity={quantity}
        isDark={isDark}
        selectedDurationMinutes={selectedDurationMinutes}
        onSelectPriceOption={onSelectPriceOption}
        onSelectDurationMinutes={onSelectDurationMinutes}
        onDecreaseQuantity={onDecreaseQuantity}
        onIncreaseQuantity={onIncreaseQuantity}
      />

      {selectedPriceOption ? (
        <Text className="mt-3 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {formatPriceOptionMeta(selectedPriceOption)}
        </Text>
      ) : null}

      <View
        className="mt-4 flex-row items-center justify-between border-t pt-4"
        style={{ borderTopColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}
      >
        <View className="mr-3 flex-1">
          <Text className="text-base font-bold text-baseDark dark:text-white">
            {APP_TEXT.main.bookingFlow.subtotalLabel}
            {unitPriceAmount != null ? (
              <Text className="text-xs font-semibold text-textPrimary/60 dark:text-white/60">
                {` (${formatSubtotalMultiplierLabel({
                  unitPriceAmount,
                  quantity,
                  priceType: selectedPriceOption?.priceType,
                  selectedDurationMinutes,
                })})`}
              </Text>
            ) : null}
          </Text>
        </View>
        <Text className="text-xl font-extrabold text-baseDark dark:text-white">
          {lineTotalAmount != null ? formatCurrencyAmount(lineTotalAmount) : '--'}
        </Text>
      </View>
      <ServiceTasksCarousel includedTasks={includedTasks} excludedTasks={excludedTasks} isDark={isDark} />
    </View>
  );
}
