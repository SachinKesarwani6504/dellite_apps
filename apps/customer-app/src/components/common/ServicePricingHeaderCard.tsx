import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ServicePricingHeaderCardProps } from '@/types/component-types';
import { PRICE_TYPE } from '@/types/customer';
import { APP_TEXT } from '@/utils/appText';
import {
  areAllPrimaryPriceOptionsFixedDuration,
  formatDurationChip,
  formatPriceOptionAmount,
  getFixedDurationMinutes,
  getRequiredPriceOptions,
  getSelectableDurations,
  titleCase,
} from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

export function ServicePricingHeaderCard({
  serviceName,
  serviceIconText,
  selectedPriceOption,
  priceOptions,
  selectedPriceOptionId,
  quantity,
  isDark,
  selectedDurationMinutes,
  onSelectPriceOption,
  onSelectDurationMinutes,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveService,
}: ServicePricingHeaderCardProps) {
  const selectablePriceOptions = getRequiredPriceOptions(priceOptions);
  const selectableDurations = getSelectableDurations(selectedPriceOption);
  const selectedPriceType = selectedPriceOption?.priceType;
  const isFixedDurationService = areAllPrimaryPriceOptionsFixedDuration(priceOptions);
  const canSelectDuration = !isFixedDurationService && selectableDurations.length > 0;
  const canSelectQuantity = selectedPriceType === PRICE_TYPE.DAILY || selectedPriceType === PRICE_TYPE.PER_UNIT;
  const normalizedServiceIconText = serviceIconText?.trim() || null;

  return (
    <View
      className="rounded-2xl px-1"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1 flex-row items-center">
          <View
            className="mr-3 h-11 w-11 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmSoftLight,
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            }}
          >
            {normalizedServiceIconText ? (
              <Text className="text-xl">{normalizedServiceIconText}</Text>
            ) : (
              <Ionicons name="sparkles-outline" size={16} color={theme.colors.primary} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-lg font-extrabold leading-6 text-baseDark dark:text-white">
              {titleCase(serviceName)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onRemoveService}
          className="h-8 w-8 items-center justify-center rounded-full border"
          style={{
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmSubtleLight,
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          }}
        >
          <Ionicons name="close" size={15} color={theme.colors.primary} />
        </Pressable>
      </View>

      {isFixedDurationService ? (
        <View className="mt-4">
          <Text className="px-2 text-xs font-bold uppercase tracking-wide text-textPrimary/70 dark:text-white/70">
            {APP_TEXT.main.bookingFlow.selectDurationTitle}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 2, gap: 10 }}
          >
            {selectablePriceOptions.map((option) => {
              const isSelected = option.id === selectedPriceOptionId;
              const durationMinutes = getFixedDurationMinutes(option);
              const durationLabel = durationMinutes != null ? `${Math.round(durationMinutes / 60)} hrs` : null;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onSelectPriceOption(option.id)}
                  className="min-w-[136px] rounded-2xl border px-4 py-3"
                  android_ripple={{ color: uiColors.surface.accentSoft40 }}
                  style={{
                    borderColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                    backgroundColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark10 : palette.light.card),
                    shadowColor: isSelected ? uiColors.shadow.base : 'transparent',
                    shadowOpacity: isSelected && !isDark ? 0.16 : 0,
                    shadowRadius: isSelected ? 10 : 0,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: isSelected ? 3 : 0,
                  }}
                >
                  <Text className={`text-sm font-extrabold ${isSelected ? 'text-white' : 'text-baseDark dark:text-white'}`}>
                    {option.title}
                  </Text>
                  <Text className={`mt-1 text-lg font-extrabold ${isSelected ? 'text-white' : 'text-primary'}`}>
                    {formatPriceOptionAmount(option)}
                  </Text>
                  {durationLabel ? (
                    <Text className={`mt-1 text-[11px] font-semibold ${isSelected ? 'text-white/85' : 'text-textPrimary/60 dark:text-white/60'}`}>
                      {durationLabel}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {!isFixedDurationService && selectablePriceOptions.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 12, paddingTop: 10, paddingBottom: 2, gap: 8 }}
        >
          {selectablePriceOptions.map((option) => {
            const isSelected = option.id === selectedPriceOptionId;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelectPriceOption(option.id)}
                className="rounded-full border px-4 py-2"
                style={{
                  borderColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                  backgroundColor: isSelected ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
                }}
              >
                <Text className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-baseDark dark:text-white'}`}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {canSelectDuration && selectedPriceOption ? (
        <View className="mt-3">
          <Text className="px-2 text-xs font-bold uppercase tracking-wide text-textPrimary/70 dark:text-white/70">Select duration</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 12, paddingTop: 8, paddingBottom: 2, gap: 8 }}
          >
            {selectableDurations.map((minutes) => {
              const isSelected = minutes === selectedDurationMinutes;
              return (
                <Pressable
                  key={`${selectedPriceOption.id}-${minutes}`}
                  onPress={() => onSelectDurationMinutes(minutes)}
                  className="rounded-full border px-4 py-2"
                  style={{
                    borderColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                    backgroundColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark10 : palette.light.card),
                  }}
                >
                  <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-baseDark dark:text-white'}`}>
                    {formatDurationChip(minutes)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {canSelectQuantity ? (
        <View className="mt-3 flex-row items-center justify-between  pb-3">
          <View className="mr-3 flex-1">
            <Text className="text-sm font-bold text-baseDark dark:text-white">Quantity</Text>
            <Text className="mt-0.5 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {selectedPriceType === PRICE_TYPE.DAILY ? 'Number of days' : 'Number of units'}
            </Text>
          </View>
          <View
            className="flex-row items-center rounded-full border px-3 py-2"
            style={{
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
            }}
          >
            <Pressable onPress={onDecreaseQuantity} className="h-9 w-9 items-center justify-center rounded-full">
              <Ionicons name="remove" size={20} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
            </Pressable>
            <Text className="mx-5 text-lg font-extrabold text-baseDark dark:text-white">{quantity}</Text>
            <Pressable
              onPress={onIncreaseQuantity}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
