import { Image, Pressable, Text, useColorScheme, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { palette, theme, uiColors } from '@/utils/theme';

const appIcon = require('../assets/icon.png');

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastPayload = {
  text1?: string;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map(char => `${char}${char}`).join('')
    : normalized;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getVariantTone(variant: ToastVariant) {
  if (variant === 'success') return theme.colors.positive;
  if (variant === 'error') return theme.colors.negative;
  if (variant === 'warning') return theme.colors.caution;
  return theme.colors.primary;
}

function getColors(isDark: boolean, variant: ToastVariant) {
  const tone = getVariantTone(variant);
  return {
    borderColor: tone,
    backgroundColor: isDark ? hexToRgba(tone, 0.2) : hexToRgba(tone, 0.1),
    textColor: isDark ? palette.dark.text : palette.light.text,
  };
}

function BrandToast({ text1, variant }: ToastPayload & { variant: ToastVariant }) {
  const isDark = useColorScheme() === 'dark';
  const colors = getColors(isDark, variant);
  const message = text1?.trim() ?? '';

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
        shadowColor: uiColors.shadow.base,
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={{
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
