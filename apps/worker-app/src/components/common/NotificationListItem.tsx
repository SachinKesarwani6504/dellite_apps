import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { NotificationListItemProps } from '@/types/notifications';
import { APP_TEXT } from '@/utils/appText';
import { formatNotificationTimestamp, getNotificationTypeMeta } from '@/utils/notifications';
import { palette, theme, uiColors } from '@/utils/theme';

export function NotificationListItem({ item, onPress, onDelete, deleting }: NotificationListItemProps) {
  const isDark = useColorScheme() === 'dark';
  const meta = getNotificationTypeMeta(item.type);
  const backgroundColor = isDark ? uiColors.surface.cardDefaultDark : palette.light.card;
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const softAccent = isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20;

  const renderRightActions = () => (
    <View className="mb-3 ml-2 mr-1 w-20 overflow-hidden rounded-2xl" style={{ backgroundColor: theme.colors.negative }}>
      <Pressable
        disabled={deleting}
        onPress={() => onDelete(item)}
        className="h-full min-h-[92px] items-center justify-center"
      >
        {deleting ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <>
            <Ionicons name="trash-outline" size={20} color={theme.colors.onPrimary} />
            <Text className="mt-1 text-[11px] font-bold" style={{ color: theme.colors.onPrimary }}>
              {APP_TEXT.notifications.deleteAction}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false} rightThreshold={32}>
      <Pressable
        onPress={() => onPress(item)}
        className="mx-1 mb-3 rounded-3xl px-4 py-4"
        style={{
          backgroundColor,
          shadowColor: uiColors.shadow.base,
          shadowOpacity: isDark ? 0 : 0.11,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        }}
      >
        <View className="flex-row items-start">
          <View className="mr-3 h-[52px] w-[52px] items-center justify-center rounded-[18px]" style={{ backgroundColor: softAccent }}>
            <Ionicons name={meta.icon} size={22} color={meta.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-start">
              <Text className="flex-1 pr-2 text-base font-extrabold text-baseDark dark:text-white" numberOfLines={2}>
                {item.title}
              </Text>
              {!item.isRead ? (
                <View className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
              ) : null}
            </View>
            <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }} numberOfLines={3}>
              {item.message}
            </Text>
            <View className="mt-3 flex-row items-center justify-end">
              <Text className="text-xs font-semibold" style={{ color: mutedTextColor }}>
                {formatNotificationTimestamp(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}
