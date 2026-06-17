import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { customerActions } from '@/actions';
import { BookingDetailsBillTab } from '@/components/booking-details/BookingDetailsBillTab';
import { BookingTipSheetContent } from '@/components/booking-details/BookingTipSheetContent';
import { BookingDetailsHistoryTab } from '@/components/booking-details/BookingDetailsHistoryTab';
import { BookingDetailsLiveLocationTab } from '@/components/booking-details/BookingDetailsLiveLocationTab';
import { BookingDetailsPaymentTab } from '@/components/booking-details/BookingDetailsPaymentTab';
import { BookingDetailsServicesTab } from '@/components/booking-details/BookingDetailsServicesTab';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { LoadingState } from '@/components/common/LoadingState';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { ScrollablePillTabs } from '@/components/common/ScrollablePillTabs';
import { AppImage } from '@/components/common/AppImage';
import { StatusInfoTile } from '@/components/common/StatusInfoTile';
import { useBottomSheetContext } from '@/contexts/BottomSheetContext';
import { BookingDetailsProvider, useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { BOOKING_STATUS } from '@/types/booking';
import type { BookingDetailsTabValue } from '@/types/booking-details';
import type { BookingDetailsScreenProps } from '@/types/main-screens';
import { BOOKINGS_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { canCustomerAddTip, canCustomerCancelBooking, canCustomerEditBooking } from '@/utils/booking-actions';
import {
  getBookingDetailsHeaderSubtitle,
  getBookingDetailsOverviewChips,
  getBookingDetailsOverviewRows,
  getBookingDetailsNotes,
  getBookingDetailsTabs,
  getBookingPaymentInfo,
} from '@/utils/booking-details';
import { extractImageUrl } from '@/utils';
import { showToast } from '@/utils/toast';
import { palette, theme, uiColors } from '@/utils/theme';

function BookingDetailsContent({ navigation }: Pick<BookingDetailsScreenProps, 'navigation'>) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [activeTab, setActiveTab] = useState<BookingDetailsTabValue>('BILL');
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const hasHandledInitialFocusRef = useRef(false);
  const { showConfirmSheet, showCustomSheet } = useBottomSheetContext();
  const {
    details,
    startOtp,
    shouldShowOtpBlock,
    isInitialLoading,
    error,
    isNotFound,
    refresh,
  } = useBookingDetailsContext();

  const showLiveLocation = useMemo(() => {
    if (!details) return false;
    const status = details.booking.bookingStatus;
    return status === BOOKING_STATUS.CONFIRMED || status === BOOKING_STATUS.IN_PROGRESS;
  }, [details]);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useFocusEffect(useCallback(() => {
    if (!hasHandledInitialFocusRef.current) {
      hasHandledInitialFocusRef.current = true;
      return undefined;
    }

    void refresh();
    return undefined;
  }, [refresh]));

  const { refreshing, onRefresh } = usePullToRefresh(handleRefresh);
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
  const headerBookingStatus = details?.booking.bookingStatus ?? BOOKING_STATUS.SEARCHING;
  const inviteStatus = details?.invite?.inviteStatus ?? null;
  const showInitialLoading = isInitialLoading && !details;
  const showNotFoundState = !showInitialLoading && isNotFound && !details;
  const showErrorState = !showInitialLoading && !showNotFoundState && Boolean(error) && !details;
  const canEditBooking = canCustomerEditBooking(details);
  const canCancelBooking = canCustomerCancelBooking(details);
  const canAddTip = canCustomerAddTip(details);
  const payment = getBookingPaymentInfo(details);
  const canCallWorker = details?.booking.bookingStatus === BOOKING_STATUS.CONFIRMED
    || details?.booking.bookingStatus === BOOKING_STATUS.IN_PROGRESS;
  const workerPhone = details?.workerInfo?.user?.phone?.trim() ?? '';

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'BILL':
        return (
          <BookingDetailsBillTab />
        );
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
      case 'PAYMENT':
        return (
          <BookingDetailsPaymentTab
            onAddTip={canAddTip ? handleAddTip : undefined}
            onRemoveTip={canAddTip ? handleRemoveTip : undefined}
          />
        );
      case 'ASSIGNMENTS':
        return <BookingDetailsHistoryTab />;
      default:
        return null;
    }
  };

  const handleEditBooking = () => {
    if (!details?.booking.id) return;
    navigation.navigate(BOOKINGS_SCREEN.EDIT, { bookingId: details.booking.id });
  };

  const handleCallWorker = useCallback(async () => {
    if (!details?.booking.id || !workerPhone) return;
    try {
      await customerActions.createCustomerBookingContactEvent(details.booking.id, 'CUSTOMER_CALLED_WORKER', {
        metadata: { source: 'booking_detail' },
      });
    } catch {
      showToast('info', APP_TEXT.main.bookings.contactEventError);
    } finally {
      void Linking.openURL(`tel:${workerPhone}`);
    }
  }, [details?.booking.id, workerPhone]);

  const cancelBooking = useCallback(async () => {
    if (!details?.booking.id) return;
    setBookingActionLoading(true);
    try {
      await customerActions.updateCustomerBookingStatus(details.booking.id, 'CANCELLED');
      await refresh();
    } catch (cancelError) {
      showToast('error', cancelError instanceof Error ? cancelError.message : APP_TEXT.main.bookings.cancelError);
    } finally {
      setBookingActionLoading(false);
    }
  }, [details?.booking.id, refresh]);

  const handleCancelBooking = useCallback(() => {
    showConfirmSheet({
      title: APP_TEXT.main.bookings.cancelConfirmTitle,
      subtitle: APP_TEXT.main.bookings.cancelConfirmSubtitle,
      confirmAction: {
        id: 'cancel-booking',
        label: APP_TEXT.main.bookings.cancelConfirmButton,
        tone: 'danger',
        closeOnPress: false,
        onPress: cancelBooking,
      },
    });
  }, [cancelBooking, showConfirmSheet]);

  const completeWork = useCallback(async () => {
    if (!details?.booking.id) return;
    setBookingActionLoading(true);
    try {
      await customerActions.markCustomerWorkCompleted(details.booking.id);
      await refresh();
    } catch (completionError) {
      showToast('error', completionError instanceof Error ? completionError.message : APP_TEXT.main.bookings.workCompletionError);
    } finally {
      setBookingActionLoading(false);
    }
  }, [details?.booking.id, refresh]);

  const handleMarkWorkCompleted = useCallback(() => {
    showConfirmSheet({
      title: APP_TEXT.main.bookings.workCompletionConfirmTitle,
      subtitle: APP_TEXT.main.bookings.workCompletionConfirmSubtitle,
      confirmAction: {
        id: 'complete-customer-booking-work',
        label: APP_TEXT.main.bookings.workCompletionConfirmButton,
        tone: 'primary',
        closeOnPress: false,
        onPress: completeWork,
      },
    });
  }, [completeWork, showConfirmSheet]);

  const handleAddTip = useCallback(() => {
    if (!canAddTip) return;

    const initialTipAmount = (() => {
      const tipValue = payment?.tipAmount;
      if (tipValue == null) return null;
      const parsedTip = Number(tipValue);
      return Number.isFinite(parsedTip) && parsedTip > 0 ? parsedTip : null;
    })();

    showCustomSheet({
      title: APP_TEXT.main.bookings.tipSheetTitle,
      subtitle: APP_TEXT.main.bookings.tipSheetSubtitle,
      renderContent: ({ closeSheet }) => (
        <BookingTipSheetContent
          initialTipAmount={initialTipAmount}
          onClose={closeSheet}
          onConfirmTip={async (amount) => {
            if (!details?.booking.id) return;
            await customerActions.updateCustomerBookingTip(details.booking.id, { tipAmount: amount });
            await refresh();
          }}
        />
      ),
    });
  }, [canAddTip, details?.booking.id, payment?.tipAmount, refresh, showCustomSheet]);

  const handleRemoveTip = useCallback(async () => {
    if (!canAddTip || !details?.booking.id) return;
    try {
      await customerActions.updateCustomerBookingTip(details.booking.id, { tipAmount: null });
      await refresh();
    } catch (tipError) {
      showToast('error', tipError instanceof Error ? tipError.message : APP_TEXT.main.bookings.tipUpdateError);
    }
  }, [canAddTip, details?.booking.id, refresh]);

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
    >
      <DetailsTopBar
        onBack={() => navigation.goBack()}
        onEdit={canEditBooking ? handleEditBooking : undefined}
        editLabel={APP_TEXT.main.bookings.editAction}
      />

      {showInitialLoading ? (
        <LoadingState minHeight={360} />
      ) : null}

      {showNotFoundState ? (
        <ListEmptyState
          containerClassName="mt-4"
          icon="search-outline"
          title="Booking not found"
          description="This booking may have been removed, expired, or is no longer available for your account."
          actionLabel="Refresh"
          onAction={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {showErrorState ? (
        <ListErrorState
          containerClassName="mt-4"
          title={error ?? APP_TEXT.main.bookings.detailsLoadError}
          description={APP_TEXT.main.bookings.tryAgainDescription}
          actionLabel={APP_TEXT.main.bookings.retryAction}
          onAction={() => {
            void handleRefresh();
          }}
        />
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

              <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
                <StatusInfoTile
                  status={headerBookingStatus}
                  type="booking"
                  subtitle={APP_TEXT.main.bookings.cardBookingStatusLabel}
                />
                {inviteStatus ? (
                  <StatusInfoTile
                    status={inviteStatus}
                    type="invite"
                    subtitle={APP_TEXT.main.bookings.cardInviteStatusLabel}
                  />
                ) : null}
              </View>

              {getBookingDetailsNotes(details) ? (
                <View
                  className="mt-3 flex-row items-start border px-3 py-3"
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
                    <Ionicons name="document-text-outline" size={14} color={theme.colors.primary} />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text className="text-xs font-semibold" style={{ color: mutedTextColor }}>
                      {APP_TEXT.main.bookingFlow.summaryNotes}
                    </Text>
                    <Text className="mt-0.5 text-sm font-bold leading-5 text-baseDark dark:text-white">
                      {getBookingDetailsNotes(details)}
                    </Text>
                  </View>
                </View>
              ) : null}
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

                {canCallWorker && workerPhone ? (
                  <Pressable
                    accessibilityLabel={APP_TEXT.main.bookings.callWorkerAction}
                    onPress={() => {
                      void handleCallWorker();
                    }}
                    className="h-11 w-11 items-center justify-center rounded-full border"
                    style={{
                      backgroundColor: theme.colors.primary,
                      borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                    }}
                  >
                    <Ionicons name="call" size={19} color={theme.colors.onPrimary} />
                  </Pressable>
                ) : null}

              </View>
            );
          })()}

          {canCancelBooking ? (
            <View className="mt-3 overflow-hidden rounded-2xl border px-4 py-4" style={cardStyle}>
              <View className="flex-row items-center">
                <View
                  className="h-12 w-12 items-center justify-center rounded-full border"
                  style={{
                    borderColor: theme.colors.secondary,
                    backgroundColor: isDark ? `${theme.colors.secondary}18` : `${theme.colors.secondary}12`,
                  }}
                >
                  <Ionicons name="warning-outline" size={21} color={theme.colors.secondary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-extrabold text-baseDark dark:text-white">
                    {APP_TEXT.main.bookings.cancelCardTitle}
                  </Text>
                  <Text className="mt-0.5 text-sm leading-5" style={{ color: mutedTextColor }}>
                    {APP_TEXT.main.bookings.cancelCardSubtitle}
                  </Text>
                </View>
                <Pressable
                  disabled={bookingActionLoading}
                  onPress={handleCancelBooking}
                  className="ml-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: theme.colors.secondary,
                    backgroundColor: isDark ? `${theme.colors.secondary}08` : palette.light.card,
                    opacity: bookingActionLoading ? 0.65 : 1,
                  }}
                >
                  <Text className="text-sm font-extrabold" style={{ color: theme.colors.secondary }}>
                    {APP_TEXT.main.bookings.cancelAction}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {shouldShowOtpBlock && startOtp?.otp ? (
            <View className="mt-3 overflow-hidden rounded-2xl border" style={cardStyle}>
              <View className="flex-row items-start px-4 pt-4">
                <View
                  className="h-11 w-11 items-center justify-center rounded-full border"
                  style={{
                    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-extrabold text-baseDark dark:text-white">
                    {APP_TEXT.main.bookings.startOtpTitle}
                  </Text>
                  <Text className="mt-0.5 text-sm leading-5" style={{ color: mutedTextColor }}>
                    {APP_TEXT.main.bookings.startOtpSubtitle}
                  </Text>
                </View>
              </View>

              <View className="px-4 pb-4 pt-4">
                <View className="flex-row items-center justify-center">
                  {(startOtp.otp.trim().slice(0, 4).split('')).map((digit, index) => (
                    <View
                      key={`otp-${index}`}
                      className="mx-1 h-12 w-12 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                        backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
                      }}
                    >
                      <Text className="text-xl font-extrabold text-primary">{digit}</Text>
                    </View>
                  ))}
                </View>
                <View className="mt-4 flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95 }}>
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <Text className="ml-2 flex-1 text-xs font-medium leading-4" style={{ color: mutedTextColor }}>
                    {APP_TEXT.main.bookings.startOtpNote}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {details?.booking.bookingStatus === BOOKING_STATUS.IN_PROGRESS ? (
            <View className="mt-3 overflow-hidden rounded-2xl border px-4 py-4" style={cardStyle}>
              <View className="flex-row items-center">
                <View
                  className="h-12 w-12 items-center justify-center rounded-full border"
                  style={{
                    borderColor: theme.colors.primary,
                    backgroundColor: isDark ? `${theme.colors.primary}18` : uiColors.surface.accentSoft20,
                  }}
                >
                  <Ionicons name="checkmark-done-outline" size={21} color={theme.colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-extrabold text-baseDark dark:text-white">
                    {APP_TEXT.main.bookings.workCompletionPrompt}
                  </Text>
                  <Text className="mt-0.5 text-sm leading-5" style={{ color: mutedTextColor }}>
                    {APP_TEXT.main.bookings.workCompletionConfirmSubtitle}
                  </Text>
                </View>
              </View>
              <Pressable
                disabled={bookingActionLoading}
                onPress={handleMarkWorkCompleted}
                className="mt-4 overflow-hidden rounded-xl"
                style={{
                  opacity: bookingActionLoading ? 0.65 : 1,
                }}
              >
                <LinearGradient
                  colors={theme.gradients.cta}
                  locations={[0, 0.25, 0.62, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ minHeight: 48, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {bookingActionLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                  ) : (
                    <Text className="text-center text-sm font-extrabold" style={{ color: theme.colors.onPrimary }}>
                      {APP_TEXT.main.bookings.workCompletionAction}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          <ScrollablePillTabs
            items={getBookingDetailsTabs()}
            value={activeTab}
            onChange={setActiveTab}
          />

          {renderActiveTab()}

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
