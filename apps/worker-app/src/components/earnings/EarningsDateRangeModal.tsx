import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import Modal from 'react-native-modal';
import type { EarningsDateRangeModalProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { validateDateRangeInput } from '@/utils/worker-finance';
import { palette, theme, uiColors } from '@/utils/theme';

export function EarningsDateRangeModal({
  visible,
  initialStartDate,
  initialEndDate,
  onClose,
  onApply,
}: EarningsDateRangeModalProps) {
  const isDark = useColorScheme() === 'dark';
  const [startDate, setStartDate] = useState(initialStartDate ?? '');
  const [endDate, setEndDate] = useState(initialEndDate ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStartDate(initialStartDate ?? '');
      setEndDate(initialEndDate ?? '');
      setError(null);
    }
  }, [initialEndDate, initialStartDate, visible]);

  const handleApply = () => {
    const validationError = validateDateRangeInput(startDate.trim(), endDate.trim());
    if (validationError) {
      setError(validationError);
      return;
    }
    onApply(startDate.trim(), endDate.trim());
  };

  return (
    <Modal isVisible={visible} onBackdropPress={onClose} onBackButtonPress={onClose} useNativeDriver>
      <View
        className="rounded-3xl border p-5"
        style={{
          backgroundColor: isDark ? palette.dark.card : palette.light.card,
          borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        }}
      >
        <Text className="text-lg font-black text-baseDark dark:text-white">
          {APP_TEXT.earnings.customDateTitle}
        </Text>

        <View className="mt-4 gap-3">
          <View>
            <Text className="mb-1 text-xs font-bold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.earnings.customDateStartLabel}
            </Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder={APP_TEXT.earnings.customDatePlaceholder}
              placeholderTextColor={isDark ? uiColors.text.captionDark : uiColors.text.captionLight}
              autoCapitalize="none"
              className="rounded-xl border px-3 py-3 text-sm text-baseDark dark:text-white"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.cardNeutralLight,
              }}
            />
          </View>
          <View>
            <Text className="mb-1 text-xs font-bold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.earnings.customDateEndLabel}
            </Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder={APP_TEXT.earnings.customDatePlaceholder}
              placeholderTextColor={isDark ? uiColors.text.captionDark : uiColors.text.captionLight}
              autoCapitalize="none"
              className="rounded-xl border px-3 py-3 text-sm text-baseDark dark:text-white"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.cardNeutralLight,
              }}
            />
          </View>
        </View>

        {error ? (
          <Text className="mt-3 text-xs font-semibold" style={{ color: uiColors.status.dangerText }}>
            {error}
          </Text>
        ) : null}

        <View className="mt-5 flex-row" style={{ gap: 10 }}>
          <Pressable
            onPress={onClose}
            className="flex-1 items-center rounded-xl border py-3"
            style={{
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            }}
          >
            <Text className="text-sm font-extrabold text-baseDark dark:text-white">
              {APP_TEXT.earnings.customDateCancelAction}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            className="flex-1 items-center rounded-xl py-3"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="text-sm font-extrabold" style={{ color: theme.colors.onPrimary }}>
              {APP_TEXT.earnings.customDateApplyAction}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
