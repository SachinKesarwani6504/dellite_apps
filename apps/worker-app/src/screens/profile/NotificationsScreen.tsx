import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { NotificationListItem } from '@/components/common/NotificationListItem';
import { useNotificationsController } from '@/hooks/useNotificationsController';
import type { NotificationListItem as NotificationListItemRecord } from '@/types/notifications';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

export function NotificationsScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    markingAllRead,
    error,
    hasNextPage,
    unreadCount,
    deletingIds,
    refresh,
    loadMore,
    markAllRead,
    openNotification,
    deleteNotificationById,
  } = useNotificationsController();
  const backgroundColor = isDark ? palette.dark.background : palette.light.background;
  const cardBackground = isDark ? uiColors.surface.cardDefaultDark : palette.light.card;
  const borderColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const canMarkAllRead = unreadCount > 0 && !markingAllRead;

  const renderItem = ({ item }: { item: NotificationListItemRecord }) => (
    <NotificationListItem
      item={item}
      deleting={deletingIds.has(item.id)}
      onPress={(notification) => {
        void openNotification(notification);
      }}
      onDelete={(notification) => {
        void deleteNotificationById(notification);
      }}
    />
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <ListEmptyState
        title={error ?? APP_TEXT.notifications.emptyTitle}
        description={APP_TEXT.notifications.emptyDescription}
        icon={error ? 'alert-circle-outline' : 'notifications-outline'}
        containerClassName="mt-4"
      />
    );
  };

  const renderFooter = () => {
    if (!hasNextPage && !loadingMore) return null;
    return (
      <View className="py-4">
        <LoadMoreButton
          label={loadingMore ? APP_TEXT.notifications.loadingMore : APP_TEXT.notifications.loadMoreAction}
          loading={loadingMore}
          disabled={loadingMore}
          onPress={() => {
            void loadMore();
          }}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View className="mb-4 overflow-hidden rounded-3xl" style={{ backgroundColor: cardBackground }}>
      <LinearGradient
        colors={theme.gradients.cta}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Ionicons name="notifications" size={22} color={theme.colors.onPrimary} />
            </View>
            <Text className="mt-4 text-2xl font-extrabold" style={{ color: theme.colors.onPrimary }}>
              {APP_TEXT.notifications.title}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-white/85">
              {APP_TEXT.notifications.subtitle}
            </Text>
          </View>
          <View className="items-end">
            <View className="rounded-full bg-white/20 px-3 py-1.5">
              <Text className="text-xs font-extrabold text-white">
                {unreadCount} {APP_TEXT.notifications.unreadCountLabel}
              </Text>
            </View>
            <Pressable
              disabled={!canMarkAllRead}
              onPress={() => {
                void markAllRead();
              }}
              className="mt-3 flex-row items-center rounded-full px-3 py-2"
              style={{
                backgroundColor: canMarkAllRead ? theme.colors.onPrimary : 'rgba(255,255,255,0.18)',
                opacity: canMarkAllRead ? 1 : 0.75,
              }}
            >
              {markingAllRead ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons
                  name="checkmark-done-outline"
                  size={14}
                  color={canMarkAllRead ? theme.colors.primary : theme.colors.onPrimary}
                />
              )}
              <Text
                className="ml-1.5 text-xs font-extrabold"
                style={{ color: canMarkAllRead ? theme.colors.primary : theme.colors.onPrimary }}
              >
                {canMarkAllRead ? APP_TEXT.notifications.markAllRead : APP_TEXT.notifications.allRead}
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor }}>
      <View className="flex-1 px-4" style={{ paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}>
        <DetailsTopBar onBack={() => navigation.goBack()} />

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, flexGrow: items.length === 0 ? 1 : undefined }}
          refreshControl={(
            <RefreshControl
              key={modeKey}
              refreshing={refreshing}
              onRefresh={() => {
                void refresh();
              }}
              {...refreshProps}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
