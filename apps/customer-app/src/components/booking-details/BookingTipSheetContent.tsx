import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';

import type { BookingTipSheetContentProps } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { formatBookingMoney } from '@/utils/booking-details';
import { palette, theme, uiColors } from '@/utils/theme';

const TIP_AMOUNT_OPTIONS = [10, 20, 30, 40, 50] as const;

export function BookingTipSheetContent({
  initialTipAmount,
  onConfirmTip,
  onClose,
}: BookingTipSheetContentProps) {
  const isDark = useColorScheme() === 'dark';
  const [selectedTipAmount, setSelectedTipAmount] = useState<number | null>(initialTipAmount);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    setSelectedTipAmount(initialTipAmount);
  }, [initialTipAmount]);
  const canAddTip = selectedTipAmount != null;
  const contentBackground = isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95;
  const itemBorderColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const itemSelectedBorderColor = theme.colors.primary;
  const itemSelectedBackground = isDark ? uiColors.surface.overlayDark10 : palette.light.card;
  const itemMutedText = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {TIP_AMOUNT_OPTIONS.map((amount) => {
          const isSelected = selectedTipAmount === amount;

          return (
            <Pressable
              key={amount}
              onPress={() => {
                setSelectedTipAmount(amount);
              }}
              className="items-center justify-center"
              style={{
                width: '30%',
                minWidth: 96,
                flexGrow: 1,
                height: 94,
                borderRadius: 16,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? itemSelectedBorderColor : itemBorderColor,
                backgroundColor: isSelected ? itemSelectedBackground : contentBackground,
                paddingHorizontal: 8,
                paddingVertical: 10,
              }}
            >
              <View
                className="items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: uiColors.surface.accentSoft20,
                }}
              >
                <Ionicons name="cash-outline" size={16} color={theme.colors.primary} />
              </View>
              <Text className="mt-2 text-base font-extrabold" style={{ color: isSelected ? theme.colors.primary : (isDark ? theme.colors.onPrimary : theme.colors.baseDark) }}>
                {formatBookingMoney(amount)}
              </Text>
              <Text className="mt-0.5 text-[10px] font-bold uppercase" style={{ color: itemMutedText }}>
                Tip
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row" style={{ gap: 10 }}>
        <Pressable
          onPress={onClose}
          className="flex-1 items-center justify-center rounded-xl border px-4 py-3"
          style={{
            borderColor: itemBorderColor,
            backgroundColor: contentBackground,
          }}
        >
          <Text className="text-sm font-bold" style={{ color: theme.colors.primary }}>
            {APP_TEXT.bottomSheet.closeButton}
          </Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            if (!canAddTip) return;
            setSubmitting(true);
            try {
              await onConfirmTip(selectedTipAmount);
              onClose();
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={!canAddTip || submitting}
          className={(!canAddTip || submitting) ? 'opacity-60' : ''}
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: canAddTip ? theme.colors.primary : uiColors.surface.overlayDark14,
            paddingHorizontal: 16,
            paddingVertical: 13,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text className="text-center text-sm font-extrabold" style={{ color: canAddTip ? theme.colors.onPrimary : itemMutedText }}>
              {APP_TEXT.main.bookings.addTipAction}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
