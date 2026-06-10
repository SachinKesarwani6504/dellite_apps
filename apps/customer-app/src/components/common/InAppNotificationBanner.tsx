import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { InAppNotificationRequest } from '@/types/live-notifications';
import { palette, theme, uiColors } from '@/utils/theme';

const ICON_BY_TYPE: Record<InAppNotificationRequest['type'], keyof typeof Ionicons.glyphMap> = {
  BOOKING: 'briefcase-outline',
  JOB: 'briefcase-outline',
  PAYMENT: 'cash-outline',
  ONBOARDING: 'sparkles-outline',
  GENERAL: 'notifications-outline',
  SYSTEM: 'shield-checkmark-outline',
};

type Props = {
  notification: InAppNotificationRequest;
  onPress: () => void;
  onClose: () => void;
  topOffset?: number;
  floating?: boolean;
};

export function InAppNotificationBanner({ notification, onPress, onClose, topOffset = 0, floating = true }: Props) {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const accentColor = theme.colors.primary;
  const backgroundColor = isDark ? palette.dark.card : palette.light.card;
  const borderColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const softAccent = isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20;
  const appIconSource = require('@/assets/images/webp/icon-large-size.webp');

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: floating ? 'absolute' : 'relative',
        left: floating ? 12 : undefined,
        right: floating ? 12 : undefined,
        top: floating ? insets.top + 12 + topOffset : undefined,
        zIndex: 9999,
      }}
    >
      <Pressable
        onPress={onPress}
        className="overflow-hidden rounded-[28px] border"
        style={{
          backgroundColor,
          borderColor,
          borderRadius: 28,
          shadowColor: uiColors.shadow.base,
          shadowOpacity: isDark ? 0 : 0.13,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <View className="px-4 py-4">
          <View className="flex-row items-center">
            <View className="mr-3">
              <View className="h-[52px] w-[52px] items-center justify-center rounded-[18px]" style={{ backgroundColor: softAccent }}>
                <Image source={appIconSource} className="h-10 w-10 rounded-xl" resizeMode="contain" />
              </View>
              <View
                className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border"
                style={{ backgroundColor, borderColor }}
              >
                <Ionicons name={ICON_BY_TYPE[notification.type]} size={13} color={accentColor} />
              </View>
            </View>
            <View className="flex-1">
              <View className="flex-row items-start">
                <Text className="flex-1 text-[15px] font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
                  {notification.title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close notification"
                  hitSlop={10}
                  onPress={event => {
                    event.stopPropagation();
                    onClose();
                  }}
                  className="ml-3 h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
                >
                  <Ionicons name="close" size={16} color={isDark ? palette.dark.text : palette.light.text} />
                </Pressable>
              </View>
              <Text className="mt-1.5 text-[13px] leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
