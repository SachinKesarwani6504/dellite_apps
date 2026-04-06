import { Image, Pressable, Text, useColorScheme, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { ToastPayload, ToastVariant } from '@/types/toast';
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
  const paletteToken = isDark ? uiColors.toast.dark[variant] : uiColors.toast.light[variant];
  return {
    borderColor: tone,
    backgroundColor: paletteToken.backgroundColor,
    textColor: paletteToken.textColor,
  };
}

function BrandToast({ text1, variant }: ToastPayload & { variant: ToastVariant }) {
  const isDark = useColorScheme() === 'dark';
  const colors = getColors(isDark, variant);
  const message = text1?.trim() ?? '';

  return (
    <Pressable
      style={{
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        paddingHorizontal: 14,
        paddingVertical: 11,
        minHeight: 60,
        width: '100%',
        alignSelf: 'center',
        overflow: 'hidden',
        shadowColor: uiColors.shadow.base,
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Image source={appIcon} style={{ width: 26, height: 26, borderRadius: 7 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={{
              color: colors.textColor,
              fontSize: 14,
              fontWeight: '700',
              lineHeight: 18,
              includeFontPadding: false,
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
  success: (props: ToastPayload) => <BrandToast {...props} variant="success" />,
  error: (props: ToastPayload) => <BrandToast {...props} variant="error" />,
  info: (props: ToastPayload) => <BrandToast {...props} variant="info" />,
  warning: (props: ToastPayload) => <BrandToast {...props} variant="warning" />,
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
