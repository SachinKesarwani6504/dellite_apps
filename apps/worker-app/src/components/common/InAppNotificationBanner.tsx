import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';
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
};

export function InAppNotificationBanner({ notification, onPress, onClose }: Props) {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const accentColor = theme.colors.primary;
  const backgroundColor = isDark ? palette.dark.card : palette.light.card;
  const borderColor = isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top: insets.top + 12,
        zIndex: 9999,
      }}
    >
      <Pressable
        onPress={onPress}
        className="overflow-hidden rounded-2xl border"
        style={{
          backgroundColor,
          borderColor,
          shadowColor: uiColors.shadow.base,
          shadowOpacity: 0.16,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <View className="flex-row items-start px-4 py-3">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
            <Ionicons name={ICON_BY_TYPE[notification.type]} size={18} color={accentColor} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-sm font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
              {notification.title}
            </Text>
            <Text className="mt-1 text-xs leading-4" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }} numberOfLines={3}>
              {notification.message}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85 }}
          >
            <Ionicons name="close" size={14} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}
