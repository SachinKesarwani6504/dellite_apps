import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import {
  BOOKING_SERVICE_SUMMARY_CARD_MODE,
  type BookingServiceSummaryCardProps,
} from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingServiceSummaryCard({
  mode,
  title,
  subtitle,
  iconText,
  selectedValueLabel,
  selectedValue,
  pricingTitle,
  pricingValue,
  totalLabel,
  addons = [],
  onRemove,
}: BookingServiceSummaryCardProps) {
  const isDark = useColorScheme() === 'dark';
  const showRemove = mode === BOOKING_SERVICE_SUMMARY_CARD_MODE.EDIT && typeof onRemove === 'function';

  return (
    <View
      className="rounded-2xl border px-3.5 py-3.5"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        shadowColor: uiColors.shadow.base,
        shadowOpacity: isDark ? 0 : 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
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
            {iconText?.trim() ? (
              <Text className="text-xl">{iconText.trim()}</Text>
            ) : (
              <Ionicons name="sparkles-outline" size={16} color={theme.colors.primary} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-lg font-extrabold leading-6 text-baseDark dark:text-white">{title}</Text>
          </View>
        </View>
        {showRemove ? (
          <Pressable
            onPress={onRemove}
            className="h-8 w-8 items-center justify-center rounded-full border"
            style={{
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmSubtleLight,
              borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            }}
          >
            <Ionicons name="close" size={15} color={theme.colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <View
        className="mt-3 overflow-hidden rounded-xl border"
        style={{
          borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
          backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
        }}
      >
        <View className="flex-row items-center justify-between px-3 py-2.5">
          <View className="mr-3 flex-row items-center">
            <View
              className="h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card }}
            >
              <Ionicons
                name={selectedValueLabel.toLowerCase() === APP_TEXT.main.bookingFlow.durationLabel.toLowerCase() ? 'time-outline' : 'layers-outline'}
                size={14}
                color={theme.colors.primary}
              />
            </View>
            <Text className="ml-2 text-[11px] font-extrabold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {selectedValueLabel}
            </Text>
          </View>
          <Text className="text-sm font-extrabold text-baseDark dark:text-white">{selectedValue}</Text>
        </View>

        <View
          className="flex-row items-center justify-between border-t px-3 py-2.5"
          style={{ borderTopColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}
        >
          <View className="mr-3 flex-row items-center">
            <View
              className="h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card }}
            >
              <Ionicons name="pricetag-outline" size={14} color={theme.colors.primary} />
            </View>
            <Text className="ml-2 text-[11px] font-extrabold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {pricingTitle}
            </Text>
          </View>
          <Text className="max-w-[52%] text-right text-sm font-extrabold text-baseDark dark:text-white">{pricingValue}</Text>
        </View>
      </View>

      {addons.length > 0 ? (
        <View
          className="mt-3 rounded-xl border px-3 py-3"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
          }}
        >
          <Text className="text-xs font-extrabold text-baseDark dark:text-white">
            {APP_TEXT.main.bookingFlow.possibleAddOnsTitle}
          </Text>
          <View className="mt-2 gap-2">
            {addons.map(addon => (
              <View key={addon.id} className="flex-row items-start justify-between">
                <View className="mr-3 flex-1">
                  <Text className="text-xs font-bold text-baseDark dark:text-white">{addon.title}</Text>
                  {addon.description ? (
                    <Text className="mt-0.5 text-[11px]" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                      {addon.description}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-xs font-extrabold text-primary">{addon.pricingLabel}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View
        className="mt-3 flex-row items-center justify-between rounded-xl px-3 py-3"
        style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
      >
        <Text className="text-xs font-extrabold uppercase text-baseDark dark:text-white">
          {APP_TEXT.main.bookingFlow.subtotalLabel}
        </Text>
        <Text className="text-2xl font-extrabold text-baseDark dark:text-white">{totalLabel}</Text>
      </View>
    </View>
  );
}
