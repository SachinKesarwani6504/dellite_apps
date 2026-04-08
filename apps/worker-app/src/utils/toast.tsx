import { Image, Pressable, Text, useColorScheme, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ToastPayload, ToastVariant } from '@/types/toast';
import { palette, theme, uiColors } from '@/utils/theme';

const appIcon = require('../assets/icon.png');

function getVariantTone(variant: ToastVariant) {
  if (variant === 'success') return theme.colors.positive;
  if (variant === 'error') return theme.colors.negative;
  if (variant === 'warning') return theme.colors.caution;
  return theme.colors.primary;
}

function getColors(isDark: boolean, variant: ToastVariant) {
  const tone = getVariantTone(variant);
  const toastPalette = isDark ? uiColors.toast.dark : uiColors.toast.light;
  const variantPalette = toastPalette[variant];

  return {
    borderColor: variantPalette?.borderColor ?? tone,
    backgroundColor:
      variantPalette?.backgroundColor ?? (isDark ? palette.dark.card : palette.light.card),
    textColor: variantPalette?.textColor ?? (isDark ? palette.dark.text : palette.light.text),
  };
}

type IncomingToastPayload = ToastPayload & {
  text2?: string;
};

function BrandToast({ variant, ...payload }: IncomingToastPayload & { variant: ToastVariant }) {
  const isDark = useColorScheme() === 'dark';
  const colors = getColors(isDark, variant);
  const message = payload.text1?.trim() ?? '';

  return (
    <Pressable
      style={{
        marginHorizontal: 24,
        marginTop: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 64,
        width: '92%',
        alignSelf: 'center',
        overflow: 'hidden',
        shadowColor: uiColors.shadow.base,
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight90,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Image source={appIcon} style={{ width: 28, height: 28, borderRadius: 7 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'transparent' }}>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={{
              backgroundColor: 'transparent',
              color: colors.textColor,
              fontSize: 15,
              fontWeight: '700',
              lineHeight: 20,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            {message}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const toastConfig = {
  success: (props: IncomingToastPayload) => <BrandToast {...props} variant="success" />,
  error: (props: IncomingToastPayload) => <BrandToast {...props} variant="error" />,
  info: (props: IncomingToastPayload) => <BrandToast {...props} variant="info" />,
  warning: (props: IncomingToastPayload) => <BrandToast {...props} variant="warning" />,
} as const;

export function showTopToast(type: ToastVariant, message: string) {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    topOffset: 64,
    visibilityTime: 3500,
    autoHide: true,
  });
}

export function showApiSuccessToast(message: string) {
  showTopToast('success', message);
}

export function showApiErrorToast(message: string) {
  showTopToast('error', message);
}

export function showSuccess(message: string) {
  showApiSuccessToast(message);
}

export function showError(message: string) {
  showApiErrorToast(message);
}

export function showToast(type: ToastVariant, message: string) {
  showTopToast(type, message);
}
