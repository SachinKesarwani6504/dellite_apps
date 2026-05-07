import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { CardWrapper } from '@/components/common/CardWrapper';
import { ServicePricingHeaderCard } from '@/components/common/ServicePricingHeaderCard';
import { ServiceTasksCarousel } from '@/components/common/ServiceTasksCarousel';
import type { BookingServiceDetailCardProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { formatCurrencyAmount, formatEstimatedDurationLabel, formatPriceOptionDescription, formatPriceOptionPricingLabel, formatSubtotalMultiplierLabel, getOptionalPriceOptions } from '@/utils';
import { theme, uiColors } from '@/utils/theme';

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
  const optionalPriceOptions = getOptionalPriceOptions(service.priceOptions);
  const estimatedDurationLabel = formatEstimatedDurationLabel(selectedPriceOption?.estimatedMinutes);
  const subtotalMultiplierLabel = formatSubtotalMultiplierLabel({
    unitPriceAmount,
    quantity,
    priceType: selectedPriceOption?.priceType,
    selectedDurationMinutes,
  });

  return (
    <CardWrapper isDark={isDark}>
      <ServicePricingHeaderCard
        serviceName={service.name}
        serviceIconText={service.iconText}
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
        onRemoveService={onRemoveService}
      />

      {selectedPriceOption ? (
        <View className="mt-3">
          <View className="flex-row items-center justify-between">
            <Text className="mr-3 flex-1 text-sm font-semibold text-baseDark dark:text-white">
              {formatPriceOptionPricingLabel(selectedPriceOption)}
            </Text>
            {estimatedDurationLabel ? (
              <View
                className="flex-row items-center rounded-full border px-2.5 py-1"
                style={{
                  borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFFFFF',
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight}
                />
                <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {`Est. time ${estimatedDurationLabel}`}
                </Text>
              </View>
            ) : null}
          </View>
          {formatPriceOptionDescription(selectedPriceOption) ? (
            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {formatPriceOptionDescription(selectedPriceOption)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {optionalPriceOptions.length > 0 ? (
        <View
          className="mt-3 rounded-xl border px-3 py-3"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={15} color={theme.colors.primary} />
            <Text className="ml-1.5 text-xs font-extrabold text-baseDark dark:text-white">
              {APP_TEXT.main.bookingFlow.optionalChargesTitle}
            </Text>
          </View>
          <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {APP_TEXT.main.bookingFlow.optionalChargesSubtitle}
          </Text>
          <View className="mt-2 gap-2">
            {optionalPriceOptions.map(option => (
              <View key={option.id} className="flex-row items-start justify-between">
                <View className="mr-3 flex-1">
                  <Text className="text-xs font-bold text-baseDark dark:text-white">{option.title}</Text>
                  {formatPriceOptionDescription(option) ? (
                    <Text className="mt-0.5 text-[11px]" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                      {formatPriceOptionDescription(option)}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-xs font-extrabold text-primary">{formatPriceOptionPricingLabel(option)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <ServiceTasksCarousel includedTasks={includedTasks} excludedTasks={excludedTasks} isDark={isDark} />
      <View
        className="mt-4 flex-row items-center justify-between border-t pt-4"
        style={{ borderTopColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}
      >
        <View className="mr-3 flex-1">
          <Text className="text-base font-bold text-baseDark dark:text-white">
            {APP_TEXT.main.bookingFlow.subtotalLabel}
            {subtotalMultiplierLabel ? (
              <Text className="text-xs font-semibold text-textPrimary/60 dark:text-white/60">
                {` (${subtotalMultiplierLabel})`}
              </Text>
            ) : null}
          </Text>
        </View>
        <Text className="text-3xl font-extrabold text-baseDark dark:text-white">
          {lineTotalAmount != null ? formatCurrencyAmount(lineTotalAmount) : '--'}
        </Text>
      </View>
    </CardWrapper>
  );
}
