import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ServicePricingHeaderCardProps } from '@/types/component-types';
import { PRICE_TYPE } from '@/types/customer';
import { formatDurationChip, getSelectableDurations, titleCase } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

export function ServicePricingHeaderCard({
  serviceName,
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
}: ServicePricingHeaderCardProps) {
  const selectableDurations = getSelectableDurations(selectedPriceOption);
  const selectedPriceType = selectedPriceOption?.priceType;
  const canSelectDuration = selectableDurations.length > 0;
  const canSelectQuantity = selectedPriceType === PRICE_TYPE.DAILY || selectedPriceType === PRICE_TYPE.PER_UNIT;

  return (
    <View
      className="rounded-2xl"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
      }}
    >
      <View className="flex-row items-start">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : '#FFF1E6' }}
        >
          <Ionicons name="sparkles-outline" size={16} color={theme.colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-extrabold text-baseDark dark:text-white">{titleCase(serviceName)}</Text>
          {selectedPriceOption ? (
            <Text className="mt-1 text-xs font-semibold text-primary">
              {selectedPriceOption.title}
            </Text>
          ) : null}
        </View>
      </View>

      {priceOptions.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 12, paddingTop: 10, paddingBottom: 2, gap: 8 }}
        >
          {priceOptions.map((option) => {
            const isSelected = option.id === selectedPriceOptionId;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelectPriceOption(option.id)}
                className="rounded-full border py-2"
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
          <Text className="text-xs font-bold uppercase text-textPrimary/70 dark:text-white/70">Select duration</Text>
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
                  className="rounded-full border px-3 py-2"
                  style={{
                    borderColor: isSelected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                    backgroundColor: isSelected ? theme.colors.primary : 'transparent',
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
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
