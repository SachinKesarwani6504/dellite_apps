import { useState } from 'react';
import { Text, TextInput, TextInputProps, View, useColorScheme } from 'react-native';
import { palette, theme, uiColors } from '@/utils/theme';

type AppInputProps = TextInputProps & {
  hasError?: boolean;
  label?: string;
  isRequired?: boolean;
};

export function AppInput({ hasError = false, label, isRequired = false, ...props }: AppInputProps) {
  const isDark = useColorScheme() === 'dark';
  const [focused, setFocused] = useState(false);

  return (
    <View>
      {label ? (
        <View className="mb-2 flex-row items-center">
          <Text className="text-sm font-semibold text-baseDark dark:text-white">{label}</Text>
          {isRequired ? (
            <Text className="ml-1 text-sm font-semibold" style={{ color: theme.colors.negative }}>
              *
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        className={`rounded-2xl border ${hasError ? 'border-red-500' : focused ? 'border-primary' : 'border-accent/70 dark:border-white/10'}`}
        style={{
          backgroundColor: isDark ? palette.dark.card : palette.light.card,
          borderRadius: 16,
          transform: [{ translateY: focused ? -1 : 0 }],
          shadowColor: theme.colors.primary,
          shadowOpacity: focused ? 0.16 : 0.05,
          shadowRadius: focused ? 10 : 3,
          shadowOffset: { width: 0, height: focused ? 6 : 2 },
          elevation: focused ? 5 : 1,
        }}
      >
        <TextInput
          placeholderTextColor={uiColors.text.placeholder}
          className="px-3 py-4 text-base font-semibold text-textPrimary dark:text-white"
          keyboardAppearance={isDark ? 'dark' : 'light'}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          {...props}
        />
      </View>
    </View>
  );
}
