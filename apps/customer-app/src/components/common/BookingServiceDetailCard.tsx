import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { ServicePricingHeaderCard } from '@/components/common/ServicePricingHeaderCard';
import type { CustomerBookableService, CustomerServicePriceOption } from '@/types/customer';
import { APP_TEXT } from '@/utils/appText';
import { formatCurrencyAmount, formatPriceOptionMeta, formatTaskList, titleCase } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type BookingServiceDetailCardProps = {
  service: CustomerBookableService;
  selectedPriceOption: CustomerServicePriceOption | null;
  selectedPriceOptionId: string | null;
  quantity: number;
  unitPriceAmount: number | null;
  lineTotalAmount: number | null;
  isDark: boolean;
  selectedDurationMinutes: number | null;
  onSelectPriceOption: (priceOptionId: string) => void;
  onSelectDurationMinutes: (minutes: number) => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onRemoveService: () => void;
};

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
  const includedTaskLabels = formatTaskList(service.includedTasks);
  const excludedTaskLabels = formatTaskList(service.excludedTasks);

  return (
    <View
      className="rounded-lg border p-4"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
      }}
    >
      <View className="mb-2 flex-row justify-end">
        <Pressable
          onPress={onRemoveService}
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayLight95 }}
        >
          <Ionicons name="close" size={16} color={theme.colors.primary} />
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
                {` (${quantity} x ${formatCurrencyAmount(unitPriceAmount)})`}
              </Text>
            ) : null}
          </Text>
        </View>
        <Text className="text-xl font-extrabold text-baseDark dark:text-white">
          {lineTotalAmount != null ? formatCurrencyAmount(lineTotalAmount) : '--'}
        </Text>
      </View>

      {includedTaskLabels.length > 0 ? (
        <View className="mt-4 rounded-md px-4 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#EFFBF4' }}>
          <Text className="text-xs font-bold text-primary">{APP_TEXT.main.bookingFlow.includedTitle}</Text>
          {includedTaskLabels.map(task => (
            <View key={task} className="mt-2 flex-row items-start">
              <Ionicons name="checkmark-circle" size={14} color="#38B66B" />
              <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white">{titleCase(task)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {excludedTaskLabels.length > 0 ? (
        <View className="mt-3 rounded-md px-4 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFF4EC' }}>
          <Text className="text-xs font-bold" style={{ color: '#C46A2B' }}>{APP_TEXT.main.bookingFlow.excludedTitle}</Text>
          {excludedTaskLabels.map(task => (
            <View key={task} className="mt-2 flex-row items-start">
              <Ionicons name="close-circle" size={14} color="#DB8A43" />
              <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white">{titleCase(task)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
