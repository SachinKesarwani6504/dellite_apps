import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { BookingDetailsAssignmentStatusTab } from '@/components/booking-details/BookingDetailsAssignmentStatusTab';
import { BookingDetailsBillTab } from '@/components/booking-details/BookingDetailsBillTab';
import { BookingDetailsLiveLocationTab } from '@/components/booking-details/BookingDetailsLiveLocationTab';
import { BookingDetailsPaymentTab } from '@/components/booking-details/BookingDetailsPaymentTab';
import { BookingDetailsServicesTab } from '@/components/booking-details/BookingDetailsServicesTab';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { LoadingState } from '@/components/common/LoadingState';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ScrollablePillTabs } from '@/components/common/ScrollablePillTabs';
import { AppImage } from '@/components/common/AppImage';
import { BookingDetailsProvider, useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { BOOKING_STATUS } from '@/types/booking';
import type { BookingDetailsTabValue } from '@/types/booking-details';
import type { BookingDetailsScreenProps } from '@/types/main-screens';
import { APP_TEXT } from '@/utils/appText';
import {
  formatBookingMoney,
  getBookingDetailsHeaderSubtitle,
  getBookingDetailsOverviewChips,
  getBookingDetailsOverviewRows,
  getBookingDetailsTabs,
} from '@/utils/booking-details';
import { extractImageUrl } from '@/utils';
import { showToast } from '@/utils/toast';
import { palette, theme, uiColors } from '@/utils/theme';

function BookingDetailsContent({ navigation }: Pick<BookingDetailsScreenProps, 'navigation'>) {
  const isDark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<BookingDetailsTabValue>('BILL');
  const {
    details,
    isInitialLoading,
    error,
    refresh,
  } = useBookingDetailsContext();

  const showLiveLocation = useMemo(() => {
    if (!details) return false;
    const status = details.booking.bookingStatus;
    return status === BOOKING_STATUS.CONFIRMED || status === BOOKING_STATUS.IN_PROGRESS;
  }, [details]);

  const handleRefresh = useCallback(async () => {
    setActiveTab('BILL');
    await refresh();
  }, [refresh]);

  const refreshControlProps = useBrandRefreshControl(handleRefresh);
  const cardStyle = {
    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
    backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
    shadowColor: uiColors.shadow.base,
    shadowOpacity: isDark ? 0 : 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  };
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'BILL':
        return <BookingDetailsBillTab />;
      case 'SERVICES':
        return <BookingDetailsServicesTab />;
      case 'LIVE_LOCATION':
        if (!showLiveLocation) {
          return (
            <View className="mt-4">
              <ListEmptyState
                title="Live Location Unavailable"
                description="Worker live tracking is only active when the booking is Confirmed or In Progress."
                icon="navigate-outline"
              />
            </View>
          );
        }
        return <BookingDetailsLiveLocationTab />;
      case 'ASSIGNMENTS':
        return <BookingDetailsAssignmentStatusTab />;
      case 'PAYMENT':
        return <BookingDetailsPaymentTab />;
      default:
        return null;
    }
  };

  const handlePayNow = () => {
    showToast('info', APP_TEXT.main.bookings.detailsPaymentComingSoon);
  };

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
      refreshControl={<RefreshControl {...refreshControlProps} refreshing={refreshControlProps.refreshing} />}
    >
      <DetailsTopBar
        onBack={() => navigation.goBack()}
        onEdit={() => {}}
      />

      {isInitialLoading && !details ? (
        <LoadingState minHeight={360} />
      ) : null}

      {error ? (
        <View className="mt-4 rounded-2xl border p-4" style={cardStyle}>
          <Text className="text-sm font-semibold" style={{ color: theme.colors.negative }}>{error}</Text>
          <View className="mt-3">
            <Button label="Retry" variant="secondary" onPress={() => void handleRefresh()} />
          </View>
        </View>
      ) : null}

      {details ? (
        <>
          <View className="mt-1 overflow-hidden rounded-2xl border" style={cardStyle}>
            <View
              className="flex-row items-center justify-between border-b px-4 py-4"
              style={{
                borderBottomColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40,
              }}
            >
              <View className="mr-3 flex-1 flex-row items-center">
                <View
                  className="h-11 w-11 items-center justify-center rounded-full border"
                  style={{
                    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
                  }}
                >
                  <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xl font-extrabold leading-6 text-baseDark dark:text-white">
                    {APP_TEXT.main.bookings.detailsTitle}
                  </Text>
                  <Text className="mt-0.5 text-xs font-semibold" style={{ color: mutedTextColor }}>
                    {getBookingDetailsHeaderSubtitle(details)}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Text className="text-lg font-extrabold text-primary">
                  {formatBookingMoney(details.booking.totalAmount)}
                </Text>
              </View>
            </View>

            <View className="p-3">
              <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
                {getBookingDetailsOverviewChips(details).map(row => (
                  <View
                    key={row.key}
                    className="flex-row items-center border px-3 py-3"
                    style={{
                      width: row.isWide ? '100%' : '48.5%',
                      borderRadius: 12,
                      borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                      backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
                    }}
                  >
                    <Ionicons name={row.iconName} size={15} color={theme.colors.primary} />
                    <View className="ml-2 flex-1">
                      <Text className="text-sm font-extrabold leading-5 text-baseDark dark:text-white">{row.value}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View className="mt-2 gap-2">
                {getBookingDetailsOverviewRows(details).map(row => (
                  <View
                    key={row.key}
                    className="flex-row items-start border px-3 py-3"
                    style={{
                      borderRadius: 12,
                      borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                      backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
                    }}
                  >
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card }}
                    >
                      <Ionicons name={row.iconName} size={14} color={theme.colors.primary} />
                    </View>
                    <View className="ml-2 flex-1">
                      <Text className="mt-0.5 text-sm font-bold leading-5 text-baseDark dark:text-white">{row.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {(() => {
            const workerUser = (details as any).workerInfo?.user ?? (details as any).assignment?.worker;
            
            if (!workerUser) {
              return (
                <View
                  className="mt-3 flex-row items-center rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                    backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
                    borderStyle: 'dashed',
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight90,
                    }}
                  >
                    <Ionicons name="person-outline" size={20} color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-baseDark dark:text-white" numberOfLines={1}>
                      {APP_TEXT.main.bookings.detailsWorkerPending}
                    </Text>
                    <Text
                      className="mt-0.5 text-[11px]"
                      numberOfLines={2}
                      style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
                    >
                      {APP_TEXT.main.bookings.detailsWorkerPendingSubtitle}
                    </Text>
                  </View>
                </View>
              );
            }

            const firstName = workerUser.firstName || 'Worker';
            const lastName = workerUser.lastName || '';
            const workerName = `${firstName} ${lastName}`.trim();
            const workerImageUrl = extractImageUrl(workerUser.profileImage);

            return (
              <View className="mt-3 flex-row items-center rounded-2xl border px-4 py-3" style={cardStyle}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.accentSoft20,
                    overflow: 'hidden',
                  }}
                >
                  {workerImageUrl ? (
                    <AppImage source={{ uri: workerImageUrl }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text className="text-base font-extrabold text-primary">
                      {workerName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-base font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
                    {workerName}
                  </Text>
                  <Text className="mt-0.5 text-xs font-semibold" numberOfLines={1} style={{ color: mutedTextColor }}>
                    {APP_TEXT.main.bookings.detailsWorkerRole}
                  </Text>
                </View>

                {workerUser.phone ? (
                  <Pressable
                    onPress={() => void Linking.openURL(`tel:${workerUser.phone}`)}
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.accentSoft20 }}
                  >
                    <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            );
          })()}

          <ScrollablePillTabs
            items={getBookingDetailsTabs()}
            value={activeTab}
            onChange={setActiveTab}
          />

          {renderActiveTab()}

          {activeTab === 'BILL' ? (
            <View className="mt-4">
              <Button label={APP_TEXT.main.bookings.detailsPayNow} onPress={handlePayNow} />
            </View>
          ) : null}
        </>
      ) : null}
    </GradientScreen>
  );
}

export function BookingDetailsScreen({ navigation, route }: BookingDetailsScreenProps) {
  return (
    <BookingDetailsProvider bookingId={route.params.bookingId} role="CUSTOMER">
      <BookingDetailsContent navigation={navigation} />
    </BookingDetailsProvider>
  );
}
