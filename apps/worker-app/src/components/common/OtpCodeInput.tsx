import { useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, View, useColorScheme } from 'react-native';
import { palette, uiColors } from '@/utils/theme';

type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

function sanitizeDigits(input: string) {
  return input.replace(/\D/g, '');
}

export function OtpCodeInput({ value, onChange, length = 4, disabled = false }: OtpCodeInputProps) {
  const isDark = useColorScheme() === 'dark';
  const refs = useRef<Array<TextInput | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const digits = useMemo(() => {
    const trimmed = sanitizeDigits(value).slice(0, length);
    const arr = Array.from({ length }, (_, idx) => trimmed[idx] ?? '');
    return { arr, raw: trimmed };
  }, [value, length]);

  useEffect(() => {
    if (digits.raw.length < length) {
      setActiveIndex(Math.max(0, digits.raw.length));
    }
  }, [digits.raw, length]);

  const updateFromIndex = (index: number, nextText: string) => {
    const clean = sanitizeDigits(nextText);
    const current = digits.arr;
    const next = [...current];

    if (clean.length === 0) {
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    // Supports typing one digit or pasting multiple digits from any position.
    for (let i = 0; i < clean.length && index + i < length; i += 1) {
      next[index + i] = clean[i];
    }
    const joined = next.join('');
    onChange(joined);

    const nextFocus = Math.min(index + clean.length, length - 1);
    refs.current[nextFocus]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') return;

    if (digits.arr[index]) {
      const next = [...digits.arr];
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    if (index > 0) {
      const prev = index - 1;
      const next = [...digits.arr];
      next[prev] = '';
      onChange(next.join(''));
      refs.current[prev]?.focus();
    }
  };

  return (
    <View className="flex-row items-center justify-center">
      {digits.arr.map((digit, index) => (
        <TextInput
          key={index}
          ref={el => {
            refs.current[index] = el;
          }}
          value={digit}
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={length}
          textContentType="oneTimeCode"
          importantForAutofill="yes"
          selectTextOnFocus
          onFocus={() => setActiveIndex(index)}
          onChangeText={text => updateFromIndex(index, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          selectionColor={uiColors.refresh.lightSpinner}
          style={{
            marginRight: index === length - 1 ? 0 : 8,
            backgroundColor:
              activeIndex === index
                ? undefined
                : isDark
                  ? palette.dark.card
                  : palette.light.card,
          }}
          className={`h-14 w-14 rounded-xl border text-center text-xl font-semibold text-textPrimary dark:text-white ${
            activeIndex === index
              ? 'border-primary bg-accent/10 dark:bg-white/5'
              : 'border-accent dark:border-white/15 bg-white'
          }`}
        />
      ))}
    </View>
  );
}

