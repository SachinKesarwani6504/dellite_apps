import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { NotificationListItem } from '@/components/common/NotificationListItem';
import { StatusBadge } from '@/components/common/StatusBadge';
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
  const canMarkAllRead = unreadCount > 0 && !markingAllRead;
  const actionColor = canMarkAllRead
    ? theme.colors.primary
    : (isDark ? uiColors.text.captionDark : uiColors.text.captionLight);

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
    <View className="mb-3">
      <Text className="text-2xl font-extrabold text-baseDark dark:text-white">
        {APP_TEXT.notifications.title}
      </Text>
      <View className="mt-2 flex-row items-center justify-between">
        <StatusBadge
          status={unreadCount > 0 ? 'SEARCHING' : 'COMPLETED'}
          label={`${unreadCount} ${APP_TEXT.notifications.unreadCountLabel}`}
          iconName={unreadCount > 0 ? 'notifications' : 'checkmark-circle'}
          showDot={false}
        />
        <Pressable
          disabled={!canMarkAllRead}
          onPress={() => {
            void markAllRead();
          }}
          hitSlop={8}
          className="min-h-[36px] items-center justify-center pl-3"
          style={{ opacity: markingAllRead ? 0.7 : 1 }}
        >
          {markingAllRead ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text className="text-xs font-bold" style={{ color: actionColor }} numberOfLines={1}>
              {canMarkAllRead ? APP_TEXT.notifications.markAllRead : APP_TEXT.notifications.allRead}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor }}>
      <View className="flex-1" style={{ paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}>
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
