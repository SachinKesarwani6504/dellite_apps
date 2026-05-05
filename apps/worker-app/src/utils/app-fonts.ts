import { Text, TextInput } from 'react-native';

export const APP_FONT_FAMILY = {
  regular: 'Inter',
};

type NativeTextWithDefaults = typeof Text & {
  defaultProps?: {
    style?: unknown;
  };
};

type NativeTextInputWithDefaults = typeof TextInput & {
  defaultProps?: {
    style?: unknown;
  };
};

let didApplyGlobalFont = false;

export function applyGlobalAppFont() {
  if (didApplyGlobalFont) return;

  const textComponent = Text as NativeTextWithDefaults;
  const textInputComponent = TextInput as NativeTextInputWithDefaults;

  textComponent.defaultProps = textComponent.defaultProps ?? {};
  textComponent.defaultProps.style = [
    { fontFamily: APP_FONT_FAMILY.regular },
    textComponent.defaultProps.style,
  ];

  textInputComponent.defaultProps = textInputComponent.defaultProps ?? {};
  textInputComponent.defaultProps.style = [
    { fontFamily: APP_FONT_FAMILY.regular },
    textInputComponent.defaultProps.style,
  ];

  didApplyGlobalFont = true;
}
