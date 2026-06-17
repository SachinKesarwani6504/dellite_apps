import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, Text, View, useColorScheme, RefreshControl } from 'react-native';
import { BookingDetailsBillTab } from '@/components/booking-details/BookingDetailsBillTab';
import { BookingDetailsHistoryTab } from '@/components/booking-details/BookingDetailsHistoryTab';
import { BookingDetailsPaymentTab } from '@/components/booking-details/BookingDetailsPaymentTab';
import { BookingDetailsServicesTab } from '@/components/booking-details/BookingDetailsServicesTab';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScrollablePillTabs } from '@/components/common/ScrollablePillTabs';
import { StatusInfoTile } from '@/components/common/StatusInfoTile';
import { OtpCodeInput } from '@/components/common/OtpCodeInput';
import { WorkerBookingRouteMap } from '@/components/common/WorkerBookingRouteMap';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBottomSheetContext } from '@/contexts/BottomSheetContext';
import { useBookingLiveRoute } from '@/hooks/useBookingLiveRoute';
import { useBookingDetailsController } from '@/hooks/useBookingDetailsController';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useWorkerLiveLocationReader } from '@/hooks/useWorkerLiveLocationReader';
import { useWorkerLiveLocation } from '@/hooks/useWorkerLiveLocation';
import { AppImage } from '@/components/common/AppImage';
import type { JobStackParamList } from '@/types/navigation';
import { BOOKING_STATUS, WORKER_JOB_INVITE_STATUS } from '@/types/booking';
import type { WorkerJobInviteStatus } from '@/types/jobs';
import { APP_TEXT } from '@/utils/appText';
import {
  formatBookingAddress,
  getBookingCustomerCardDisplay,
  getBookingDetailsHeaderSubtitle,
  getBookingDetailsOverviewChips,
  getBookingDetailsOverviewRows,
  getBookingDetailsNotes,
  getBookingMapDestinationCoordinates,
  getBookingUserName,
} from '@/utils/booking-details';
import {
  canWorkerCancelBeforeStart,
  canWorkerUpdateProgress,
  canWorkerRecordPayment,
} from '@/utils/job-actions';
import { resolveWorkerIdFromAuthUser } from '@/utils';
import { createWorkerBookingContactEvent } from '@/actions/workerActions';
import { showToast } from '@/utils/toast';
import { palette, theme, uiColors } from '@/utils/theme';

const JOB_DETAILS_TABS = [
  { label: 'Bill', value: 'BILL', iconName: 'receipt-outline' as const },
  { label: 'Live location', value: 'LIVE_LOCATION', iconName: 'navigate-outline' as const },
  { label: 'Services', value: 'SERVICES', iconName: 'construct-outline' as const },
  { label: 'Payments', value: 'PAYMENT', iconName: 'card-outline' as const },
  { label: 'History', value: 'HISTORY', iconName: 'time-outline' as const },
] as const;

function getInviteStatusFromDetails(details: unknown): WorkerJobInviteStatus | null {
  if (!details || typeof details !== 'object') return null;
  const raw = details as Record<string, unknown>;
  const invite = raw.invite;
  if (!invite || typeof invite !== 'object') return null;
  const inviteStatus = (invite as Record<string, unknown>).inviteStatus;
  return typeof inviteStatus === 'string' ? (inviteStatus as WorkerJobInviteStatus) : null;
}

export function JobDetailsScreen({ navigation, route }: NativeStackScreenProps<JobStackParamList, 'JobDetails'>) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [activeTab, setActiveTab] = useState<(typeof JOB_DETAILS_TABS)[number]['value']>('BILL');
  const { showConfirmSheet } = useBottomSheetContext();
  const { user, me } = useAuthContext();
  const workerUserId = user?.id ?? null;
  const workerId = useMemo(
    () => resolveWorkerIdFromAuthUser(user, (me as Record<string, unknown> | null | undefined) ?? null),
    [me, user],
  );
  const {
    vehicleMode: liveVehicleMode,
    permissionStatus,
    error: liveLocationError,
    goOnline,
    updateAvailability,
    updateVehicleMode,
  } = useWorkerLiveLocation({ workerUserId, workerId });
  const routeVehicleMode = liveVehicleMode === 'UNKNOWN' ? 'CAR' : liveVehicleMode;
  const {
    details,
    loading,
    error,
    isNotFound,
    startOtp,
    startOtpError,
    startingJob,
    inviteActionLoading,
    jobActionLoading,
    setStartOtp,
    acceptInvite,
    rejectInvite,
    startBookingWithOtp,
    updateProgress,
    confirmPaymentReceived,
    refetch,
  } = useBookingDetailsController(route.params.jobId, 'WORKER', {
    onInviteAccepted: async () => {
      await updateAvailability(false);
    },
  });
  const showLiveLocation = useMemo(() => {
    if (!details) return false;
    const status = details.booking.bookingStatus;
    return status === BOOKING_STATUS.SEARCHING || status === BOOKING_STATUS.CONFIRMED || status === BOOKING_STATUS.IN_PROGRESS;
  }, [details]);

  const workerLiveState = useWorkerLiveLocationReader(workerUserId, workerId, Boolean(details) && showLiveLocation);
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
  const showInitialLoading = loading && !details;
  const showNotFoundState = !showInitialLoading && isNotFound && !details;
  const showErrorState = !showInitialLoading && !showNotFoundState && Boolean(error) && !details;

  const originCoordinates = useMemo(() => {
    const latitude = workerLiveState.location?.lat;
    const longitude = workerLiveState.location?.lng;
    if (typeof latitude !== 'number' || !Number.isFinite(latitude)) return null;
    if (typeof longitude !== 'number' || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }, [workerLiveState.location?.lat, workerLiveState.location?.lng]);
  const destinationCoordinates = getBookingMapDestinationCoordinates(details?.address);
  const routeState = useBookingLiveRoute({
    origin: originCoordinates,
    destination: destinationCoordinates,
    vehicleMode: routeVehicleMode,
    enabled: Boolean(details) && showLiveLocation,
  });

  const inviteStatus = useMemo(
    () => getInviteStatusFromDetails(details) ?? route.params.inviteStatus,
    [details, route.params.inviteStatus],
  );
  const headerInviteStatus = inviteStatus ?? WORKER_JOB_INVITE_STATUS.NEW_JOB_REQUEST;
  const canAcceptReject = inviteStatus === WORKER_JOB_INVITE_STATUS.VIEWED || inviteStatus === WORKER_JOB_INVITE_STATUS.NEW_JOB_REQUEST;
  const canStartWithOtp = inviteStatus === WORKER_JOB_INVITE_STATUS.ACCEPTED
    && details?.booking.bookingStatus === BOOKING_STATUS.CONFIRMED;
  const canCancelBeforeStart = canWorkerCancelBeforeStart(details);
  const canUpdateJobProgress = canWorkerUpdateProgress(details);
  const assignmentStatus = details?.assignment?.assignmentStatus?.trim().toUpperCase() ?? '';
  const canMarkArrived = canUpdateJobProgress && assignmentStatus === 'EN_ROUTE';
  const canMarkWorkerWorkComplete = canUpdateJobProgress && assignmentStatus === 'ARRIVED';
  const showWorkerProgressActions = canMarkArrived || canMarkWorkerWorkComplete;
  const canCallCustomer = details?.booking.bookingStatus === BOOKING_STATUS.CONFIRMED
    || details?.booking.bookingStatus === BOOKING_STATUS.IN_PROGRESS;
  const customerPhone = details?.customerInfo?.user?.phone?.trim() ?? '';
  const customerCard = useMemo(() => getBookingCustomerCardDisplay(details), [details]);

  const refreshDetails = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshDetails);

  const handleCallCustomer = useCallback(async () => {
    if (!details?.booking.id || !customerPhone) return;
    try {
      await createWorkerBookingContactEvent(details.booking.id, 'WORKER_CALLED_CUSTOMER', {
        metadata: { source: 'job_detail' },
      });
    } catch {
      showToast('info', APP_TEXT.jobs.contactEventError);
    } finally {
      void Linking.openURL(`tel:${customerPhone}`);
    }
  }, [customerPhone, details?.booking.id]);

  const handleCancelJob = useCallback(() => {
    showConfirmSheet({
      title: APP_TEXT.jobs.cancelConfirmTitle,
      subtitle: APP_TEXT.jobs.cancelConfirmSubtitle,
      confirmAction: {
        id: 'cancel-worker-job',
        label: APP_TEXT.jobs.cancelConfirmButton,
        tone: 'danger',
        closeOnPress: false,
        onPress: () => updateProgress('CANCELLED'),
      },
    });
  }, [showConfirmSheet, updateProgress]);

  const handleWorkerWorkComplete = useCallback(() => {
    showConfirmSheet({
      title: APP_TEXT.jobs.progressCompleteConfirmTitle,
      subtitle: APP_TEXT.jobs.progressCompleteConfirmSubtitle,
      confirmAction: {
        id: 'complete-worker-job-work',
        label: APP_TEXT.jobs.progressCompleteConfirmButton,
        tone: 'primary',
        closeOnPress: false,
        onPress: () => updateProgress('COMPLETED'),
      },
    });
  }, [showConfirmSheet, updateProgress]);

  const renderTabContent = () => {
    if (!details) return null;

    if (activeTab === 'BILL') {
      return (
        <View className="mt-4">
          <BookingDetailsBillTab booking={details.booking} />
        </View>
      );
    }

    if (activeTab === 'SERVICES') {
      return <BookingDetailsServicesTab details={details} />;
    }

    if (activeTab === 'PAYMENT') {
      return (
        <BookingDetailsPaymentTab
          details={details}
          canRecordPayment={canWorkerRecordPayment(details)}
          jobActionLoading={jobActionLoading}
          onConfirmPaymentReceived={confirmPaymentReceived}
        />
      );
    }

    if (activeTab === 'LIVE_LOCATION') {
      if (!showLiveLocation) {
        return (
          <View className="mt-4 rounded-2xl border p-4" style={cardStyle}>
            <View className="flex-row items-start">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
              >
                <Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-extrabold text-baseDark dark:text-white">
                  {APP_TEXT.jobs.liveLocationNotReadyTitle}
                </Text>
                <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
                  {APP_TEXT.jobs.liveLocationNotReadySubtitle}
                </Text>
              </View>
            </View>
          </View>
        );
      }

      const shouldShowLocationEnableState = permissionStatus === Location.PermissionStatus.DENIED
        || (!originCoordinates && Boolean(liveLocationError));

      if (shouldShowLocationEnableState) {
        return (
          <View className="mt-4 rounded-2xl border p-4" style={cardStyle}>
            <View className="flex-row items-start">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
              >
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-extrabold text-baseDark dark:text-white">
                  {APP_TEXT.jobs.liveLocation.locationAccessTitle}
                </Text>
                <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
                  {APP_TEXT.jobs.liveLocation.locationAccessSubtitle}
                </Text>
              </View>
            </View>
            <View className="mt-4">
              <Button
                label={APP_TEXT.jobs.liveLocation.locationAccessButton}
                onPress={() => {
                  void goOnline();
                }}
              />
            </View>
          </View>
        );
      }

      if (!originCoordinates) {
        return (
          <ListEmptyState
            containerClassName="mt-4"
            title={APP_TEXT.jobs.liveLocationUnavailableTitle}
            description={APP_TEXT.jobs.liveLocationUnavailableSubtitle}
            icon="navigate-outline"
          />
        );
      }

      return (
        <View className="mt-4 gap-3">
          <WorkerBookingRouteMap
            workerLiveLocation={workerLiveState.location}
            originCoordinates={originCoordinates}
            destinationCoordinates={destinationCoordinates}
            vehicleMode={routeVehicleMode}
            route={routeState.route}
            isDark={isDark}
            loading={workerLiveState.loading || routeState.loading}
            error={routeState.error ?? workerLiveState.error}
            onVehicleModeChange={(mode) => {
              void updateVehicleMode(mode);
            }}
          />
        </View>
      );
    }

    if (activeTab === 'HISTORY') {
      return <BookingDetailsHistoryTab details={details} />;
    }

    return null;
  };

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
    >
      <DetailsTopBar onBack={() => navigation.goBack()} />

      {showInitialLoading ? (
        <LoadingState minHeight={360} />
      ) : null}

      {showNotFoundState ? (
        <ListEmptyState
          containerClassName="mt-4"
          icon="search-outline"
          title="Job not found"
          description="This job may have been removed, expired, or is no longer available for your account."
          actionLabel="Refresh"
          onAction={() => {
            void refetch();
          }}
        />
      ) : null}

      {showErrorState ? (
        <ListErrorState
          containerClassName="mt-4"
          title={error ?? APP_TEXT.jobs.detailsLoadError}
          description={APP_TEXT.jobs.tryAgainDescription}
          actionLabel={APP_TEXT.jobs.retryAction}
          onAction={() => {
            void refetch();
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
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xl font-extrabold leading-6 text-baseDark dark:text-white">
                    {APP_TEXT.jobs.detailsTitle}
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
                    <Ionicons name={row.iconName as keyof typeof Ionicons.glyphMap} size={15} color={theme.colors.primary} />
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
                      <Ionicons name={row.iconName as keyof typeof Ionicons.glyphMap} size={14} color={theme.colors.primary} />
                    </View>
                    <View className="ml-2 flex-1">
                      <Text className="mt-0.5 text-sm font-bold leading-5 text-baseDark dark:text-white">{row.value}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
                <StatusInfoTile
                  status={details.booking.bookingStatus ?? 'CREATED'}
                  type="booking"
                  subtitle={APP_TEXT.jobs.cardBookingStatusLabel}
                />
                <StatusInfoTile
                  status={headerInviteStatus}
                  type="invite"
                  subtitle={APP_TEXT.jobs.cardInviteStatusLabel}
                />
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
                      {APP_TEXT.jobs.detailsNotesLabel}
                    </Text>
                    <Text className="mt-0.5 text-sm font-bold leading-5 text-baseDark dark:text-white">
                      {getBookingDetailsNotes(details)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View
            className="mt-3 flex-row items-center rounded-2xl border px-4 py-3"
            style={{
              borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
              backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
              shadowColor: uiColors.shadow.base,
              shadowOpacity: isDark ? 0 : 0.07,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
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
              {customerCard.profileImageUrl ? (
                <AppImage source={{ uri: customerCard.profileImageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text className="text-base font-extrabold text-primary">
                  {customerCard.initial}
                </Text>
              )}
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-base font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
                {customerCard.name ?? getBookingUserName(details.customerInfo?.user)}
              </Text>
              <Text
                className="mt-0.5 text-xs font-semibold"
                numberOfLines={1}
                style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
              >
                Customer
              </Text>
            </View>

            {canCallCustomer && customerPhone ? (
              <Pressable
                accessibilityLabel={APP_TEXT.jobs.callCustomerAction}
                onPress={() => {
                  void handleCallCustomer();
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

          {canCancelBeforeStart ? (
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
                    {APP_TEXT.jobs.cancelCardTitle}
                  </Text>
                  <Text className="mt-0.5 text-sm leading-5" style={{ color: mutedTextColor }}>
                    {APP_TEXT.jobs.cancelCardSubtitle}
                  </Text>
                </View>
                <Pressable
                  disabled={Boolean(jobActionLoading)}
                  onPress={handleCancelJob}
                  className="ml-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: theme.colors.secondary,
                    backgroundColor: isDark ? `${theme.colors.secondary}08` : palette.light.card,
                    opacity: jobActionLoading ? 0.65 : 1,
                  }}
                >
                  <Text className="text-sm font-extrabold" style={{ color: theme.colors.secondary }}>
                    {APP_TEXT.jobs.cancelAction}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {canStartWithOtp ? (
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
                    {APP_TEXT.jobs.startOtpTitle}
                  </Text>
                  <Text className="mt-0.5 text-sm leading-5" style={{ color: mutedTextColor }}>
                    {APP_TEXT.jobs.startOtpSubtitle}
                  </Text>
                </View>
              </View>

              <View className="px-4 pb-4 pt-4">
                <OtpCodeInput
                  value={startOtp}
                  onChange={(value) => {
                    setStartOtp(value);
                  }}
                  length={4}
                  disabled={startingJob}
                />
                {startOtpError ? (
                  <Text className="mt-2 text-xs font-semibold" style={{ color: theme.colors.negative }}>
                    {startOtpError}
                  </Text>
                ) : null}
                <View className="mt-4 flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95 }}>
                  <View
                    className="h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <Text className="ml-2 flex-1 text-xs font-medium leading-4" style={{ color: mutedTextColor }}>
                    {APP_TEXT.jobs.startOtpNote}
                  </Text>
                </View>
                <View className="mt-4">
                  <Button
                    label={APP_TEXT.jobs.startOtpButton}
                    onPress={() => {
                      void startBookingWithOtp();
                    }}
                    loading={startingJob}
                    disabled={startOtp.trim().length !== 4 || startingJob}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {showWorkerProgressActions ? (
            <View className="mt-3 overflow-hidden rounded-2xl border px-4 py-4" style={cardStyle}>
              <View className="flex-row items-start">
                <View
                  className="h-12 w-12 items-center justify-center rounded-full border"
                  style={{
                    borderColor: theme.colors.primary,
                    backgroundColor: isDark ? `${theme.colors.primary}18` : uiColors.surface.accentSoft20,
                  }}
                >
                  <Ionicons name="walk-outline" size={21} color={theme.colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-extrabold text-baseDark dark:text-white">
                    {APP_TEXT.jobs.progressTitle}
                  </Text>
                  <Text className="mt-0.5 text-sm leading-5" style={{ color: mutedTextColor }}>
                    {canMarkWorkerWorkComplete
                      ? APP_TEXT.jobs.progressCompleteHint
                      : APP_TEXT.jobs.progressArrivedHint}
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row items-center" style={{ gap: 10 }}>
                {canMarkArrived ? (
                  <View className="flex-1">
                    <Button
                      label={APP_TEXT.jobs.progressArrived}
                      loading={jobActionLoading === 'ARRIVED'}
                      disabled={Boolean(jobActionLoading)}
                      onPress={() => {
                        void updateProgress('ARRIVED');
                      }}
                    />
                  </View>
                ) : null}
                {canMarkWorkerWorkComplete ? (
                  <View className="flex-1">
                    <Button
                      label={APP_TEXT.jobs.progressComplete}
                      loading={jobActionLoading === 'COMPLETED'}
                      disabled={Boolean(jobActionLoading)}
                      onPress={() => {
                        handleWorkerWorkComplete();
                      }}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          <ScrollablePillTabs
            items={JOB_DETAILS_TABS as any}
            value={activeTab}
            onChange={setActiveTab}
          />

          {renderTabContent()}

          {canAcceptReject && activeTab === 'BILL' ? (
            <View className="mt-4 flex-row items-center" style={{ gap: 10 }}>
              <View className="flex-1">
                <Button
                  label={inviteActionLoading === WORKER_JOB_INVITE_STATUS.REJECTED ? 'Rejecting...' : 'Reject'}
                  variant="secondary"
                  onPress={() => void rejectInvite()}
                  disabled={Boolean(inviteActionLoading)}
                />
              </View>
              <View className="flex-1">
                <Button
              label={inviteActionLoading === WORKER_JOB_INVITE_STATUS.ACCEPTED ? 'Accepting...' : 'Accept'}
                  onPress={() => void acceptInvite()}
                  disabled={Boolean(inviteActionLoading)}
                />
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </GradientScreen>
  );
}
