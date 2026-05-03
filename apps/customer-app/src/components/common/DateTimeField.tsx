import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import type { DateTimeFieldProps } from '@/types/component-types';
import { formatDateTimeFieldDisplayValue, formatDateValue, formatTimeValue, parseDateTimeFieldValue } from '@/utils/date-time';
import { palette, theme, uiColors } from '@/utils/theme';

export function DateTimeField({
  label,
  value,
  placeholder,
  mode,
  isRequired = false,
  onChange,
}: DateTimeFieldProps) {
  const isDark = useColorScheme() === 'dark';
  const [open, setOpen] = useState(false);
  const resolvedDate = useMemo(() => parseDateTimeFieldValue(value, mode), [mode, value]);
  const displayValue = useMemo(() => formatDateTimeFieldDisplayValue(value, mode), [mode, value]);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setOpen(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    onChange(mode === 'date' ? formatDateValue(selectedDate) : formatTimeValue(selectedDate));
  };

  return (
    <View>
      <View className="mb-2 flex-row items-center">
        <Text className="text-sm font-semibold text-baseDark dark:text-white">{label}</Text>
        {isRequired ? (
          <Text className="ml-1 text-sm font-semibold" style={{ color: theme.colors.negative }}>
            *
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-ui-lg border px-3 py-4"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? palette.dark.card : palette.light.card,
        }}
      >
        <Text
          className={`text-base font-semibold ${displayValue ? 'text-textPrimary dark:text-white' : ''}`}
          style={!displayValue ? { color: uiColors.text.placeholder } : undefined}
        >
          {displayValue || placeholder}
        </Text>
      </Pressable>

      {open ? (
        <DateTimePicker
          value={resolvedDate}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
