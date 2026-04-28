import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import { palette, theme, uiColors } from '@/utils/theme';

type DateTimeFieldMode = 'date' | 'time';

type DateTimeFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  mode: DateTimeFieldMode;
  isRequired?: boolean;
  onChange: (value: string) => void;
};

function parseValueToDate(value: string, mode: DateTimeFieldMode) {
  if (mode === 'date') {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  const [hour = '09', minute = '00'] = value.split(':');
  const next = new Date();
  next.setHours(Number(hour), Number(minute), 0, 0);
  return Number.isNaN(next.getTime()) ? new Date() : next;
}

function formatDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTimeValue(date: Date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatDisplayValue(value: string, mode: DateTimeFieldMode) {
  if (!value.trim()) return '';

  if (mode === 'date') {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsed);
  }

  const parsed = parseValueToDate(value, 'time');
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(parsed);
}

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
  const resolvedDate = useMemo(() => parseValueToDate(value, mode), [mode, value]);
  const displayValue = useMemo(() => formatDisplayValue(value, mode), [mode, value]);

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
