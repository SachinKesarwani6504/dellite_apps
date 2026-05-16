import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, RefreshControl, Text, View, useColorScheme, Pressable } from 'react-native';
import { updateBookingInvite } from '@/actions/workerActions';
import { BackButton } from '@/components/common/BackButton';
import { BookingServiceSummaryCard } from '@/components/common/BookingServiceSummaryCard';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScrollablePillTabs } from '@/components/common/ScrollablePillTabs';
import { WorkerBookingRouteMap } from '@/components/common/WorkerBookingRouteMap';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingLiveRoute } from '@/hooks/useBookingLiveRoute';
import { useBookingDetailsController } from '@/hooks/useBookingDetailsController';
import { useWorkerLiveLocationReader } from '@/hooks/useWorkerLiveLocationReader';
import { useWorkerLiveLocation } from '@/hooks/useWorkerLiveLocation';
import type { BookingDetailsServiceLine } from '@/types/booking-details';
import type { WorkerJobInviteStatus } from '@/types/jobs';
import type { RouteVehicleMode } from '@/types/live-route';
import type { JobStackParamList } from '@/types/navigation';
import { APP_TEXT } from '@/utils/appText';
import {
  formatBookingAddress,
  formatBookingDateTime,
  formatBookingMoney,
  getBookingLineDurationMinutes,
  getBookingLineKey,
  getBookingLineQuantity,
  getBookingMapDestinationCoordinates,
  getBookingStatusLabel,
  getBookingUserName,
  isBookingHourlyLine,
  titleCaseBookingValue,
} from '@/utils/booking-details';
import { resolveWorkerIdFromAuthUser } from '@/utils';
import { showToast } from '@/utils/toast';
import { palette, theme, uiColors } from '@/utils/theme';

const JOB_DETAILS_TABS = [
  { label: 'Bill', value: 'BILL', iconName: 'receipt-outline' as const },
  { label: 'Services', value: 'SERVICES', iconName: 'construct-outline' as const },
  { label: 'Live Location', value: 'LIVE_LOCATION', iconName: 'navigate-outline' as const },
  { label: 'History', value: 'HISTORY', iconName: 'time-outline' as const },
] as const;

function getLineSelectedValue(line: BookingDetailsServiceLine) {
  if (isBookingHourlyLine(line)) {
    const minutes = getBookingLineDurationMinutes(line);
    const hoursLabel = minutes ? `${Math.max(1, Math.round(minutes / 60))} hr` : '1 hr';
    return {
      label: 'Duration',
      value: hoursLabel,
    };
  }

  return {
    label: 'Quantity',
    value: `${getBookingLineQuantity(line)}`,
  };
}

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
  const [activeTab, setActiveTab] = useState<(typeof JOB_DETAILS_TABS)[number]['value']>('BILL');
  const [selectedVehicleMode, setSelectedVehicleMode] = useState<RouteVehicleMode>('CAR');
  const [refreshing, setRefreshing] = useState(false);
  const [inviteActionLoading, setInviteActionLoading] = useState<null | 'ACCEPTED' | 'REJECTED'>(null);
  const { user, me } = useAuthContext();
  const workerId = useMemo(
    () => resolveWorkerIdFromAuthUser(user, (me as Record<string, unknown> | null | undefined) ?? null),
    [me, user],
  );
  const { vehicleMode: liveVehicleMode, updateVehicleMode } = useWorkerLiveLocation({ workerId });
  const {
    details,
    loading,
    error,
    refetch,
  } = useBookingDetailsController(route.params.jobId, 'WORKER');
  const workerLiveState = useWorkerLiveLocationReader(workerId, Boolean(details));
  const { refreshProps } = useBrandRefreshControlProps();
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
    vehicleMode: selectedVehicleMode,
    enabled: Boolean(details),
  });

  const inviteStatus = useMemo(
    () => route.params.inviteStatus ?? getInviteStatusFromDetails(details),
    [details, route.params.inviteStatus],
  );
  const canAcceptReject = inviteStatus === 'VIEWED' || inviteStatus === 'NEW_JOB_REQUEST';
  const inviteId = useMemo(() => {
    const id = details?.invite?.id;
    return typeof id === 'string' && id.trim().length > 0 ? id.trim() : null;
  }, [details?.invite?.id]);

  useEffect(() => {
    if (liveVehicleMode && liveVehicleMode !== 'UNKNOWN') {
      setSelectedVehicleMode(liveVehicleMode);
    }
  }, [liveVehicleMode]);

  const refreshDetails = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onAccept = useCallback(async () => {
    if (!inviteId) {
      showToast('error', 'Invite id not found for this job.');
      return;
    }
    setInviteActionLoading('ACCEPTED');
    try {
      await updateBookingInvite(inviteId, 'ACCEPTED');
      await refetch();
    } finally {
      setInviteActionLoading(null);
    }
  }, [inviteId, refetch]);

  const onReject = useCallback(async () => {
    if (!inviteId) {
      showToast('error', 'Invite id not found for this job.');
      return;
    }
    setInviteActionLoading('REJECTED');
    try {
      await updateBookingInvite(inviteId, 'REJECTED');
      await refetch();
    } finally {
      setInviteActionLoading(null);
    }
  }, [inviteId, refetch]);

  const renderTabContent = () => {
    if (!details) return null;

    if (activeTab === 'BILL') {
      const totalAmount = Number(details.booking.totalAmount ?? 0);
      const commissionAmount = Number(details.booking.bookingCommissionAmount ?? 0);
      const payoutAmount = Math.max(0, totalAmount - commissionAmount);
      return (
        <View className="mt-4 overflow-hidden rounded-2xl border" style={cardStyle}>
          <View className="flex-row items-center px-4 py-4" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}>
            <Ionicons name="sparkles-outline" size={21} color={theme.colors.primary} />
            <Text className="ml-2 text-base font-extrabold uppercase tracking-[2px] text-baseDark dark:text-white">
              Bill Summary
            </Text>
          </View>

          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-baseDark dark:text-white">Booking Total</Text>
              <Text className="text-base font-extrabold text-baseDark dark:text-white">{formatBookingMoney(details.booking.totalAmount)}</Text>
            </View>

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-sm text-baseDark dark:text-white">Commission</Text>
              <Text className="text-base font-extrabold text-primary">{formatBookingMoney(commissionAmount)}</Text>
            </View>

            <View className="my-4 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />

            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-xs font-extrabold uppercase" style={{ color: mutedTextColor }}>
                  Your Payout
                </Text>
                <Text className="mt-1 text-4xl font-extrabold" style={{ color: theme.colors.primary }}>
                  {formatBookingMoney(payoutAmount)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === 'SERVICES') {
      return (
        <View className="mt-4 gap-3">
          {(details.serviceLines ?? []).map((line, index) => {
            const selectedValue = getLineSelectedValue(line);
            return (
              <BookingServiceSummaryCard
                key={line.id ?? `${getBookingLineKey(line)}-${index}`}
                mode="VIEW"
                title={titleCaseBookingValue(line.serviceName)}
                subtitle={titleCaseBookingValue(line.subCategoryName ?? line.categoryName)}
                selectedValueLabel={selectedValue.label}
                selectedValue={selectedValue.value}
                pricingTitle="Rate"
                pricingValue={formatBookingMoney(line.unitPriceAmount)}
                totalLabel={formatBookingMoney(line.lineTotalAmount)}
              />
            );
          })}
        </View>
      );
    }

    if (activeTab === 'LIVE_LOCATION') {
      if (!originCoordinates) {
        return (
          <ListEmptyState
            containerClassName="mt-4"
            title="Live location unavailable"
            description="Worker live location is not available in RTDB yet."
            icon="navigate-outline"
          />
        );
      }

      return (
        <View className="mt-4 gap-3">
          <WorkerBookingRouteMap
            originCoordinates={originCoordinates}
            destinationCoordinates={destinationCoordinates}
            vehicleMode={selectedVehicleMode}
            onVehicleModeChange={(mode) => {
              setSelectedVehicleMode(mode);
              void updateVehicleMode(mode);
            }}
            route={routeState.route}
            isDark={isDark}
            loading={workerLiveState.loading || routeState.loading}
            error={routeState.error ?? workerLiveState.error}
          />
        </View>
      );
    }

    if ((details.history ?? []).length === 0) {
      return (
        <ListEmptyState
          containerClassName="mt-4"
          title="No timeline yet"
          description="Booking updates will appear here."
          icon="time-outline"
        />
      );
    }

    return (
      <View className="mt-4 gap-3">
        {(details.history ?? []).map((item, index) => (
          <View
            key={item.id ?? `history-${index}`}
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-baseDark dark:text-white">
                {titleCaseBookingValue(item.title)}
              </Text>
              <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmCardLight }}
              >
                <Text className="text-[10px] font-bold uppercase" style={{ color: mutedTextColor }}>
                  Timeline
                </Text>
              </View>
            </View>
            {item.description ? (
              <Text className="mt-2 text-sm" style={{ color: mutedTextColor }}>
                {item.description}
              </Text>
            ) : null}
            <View className="mt-3 flex-row justify-end">
              <Text className="text-xs font-semibold" style={{ color: mutedTextColor }}>
                {formatBookingDateTime(item.createdAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
      refreshControl={<RefreshControl {...refreshProps} refreshing={refreshing} onRefresh={() => void refreshDetails()} />}
    >
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      {loading && !details ? (
        <LoadingState minHeight={360} />
      ) : null}

      {error ? (
        <View className="mt-4 rounded-2xl border p-4" style={cardStyle}>
          <Text className="text-sm font-semibold" style={{ color: theme.colors.negative }}>{error}</Text>
          <View className="mt-3">
            <Button label="Retry" variant="secondary" onPress={() => void refetch()} />
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
                  <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xl font-extrabold leading-6 text-baseDark dark:text-white">
                    {APP_TEXT.jobs.detailsTitle}
                  </Text>
                  <Text className="mt-0.5 text-xs font-semibold" style={{ color: mutedTextColor }}>
                    {details.booking.bookingCode ?? details.booking.id}
                  </Text>
                </View>
              </View>
            </View>

            <View className="p-3">
              <View className="mb-2 flex-row items-center justify-between rounded-xl border px-3 py-2.5" style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
              }}>
                <Text className="text-sm font-bold text-baseDark dark:text-white">Booking Amount</Text>
                <Text className="text-lg font-extrabold" style={{ color: theme.colors.caution }}>
                  {formatBookingMoney(details.booking.totalAmount)}
                </Text>
              </View>
              <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
                {[
                  {
                    key: 'bookingType',
                    value: titleCaseBookingValue(details.booking.bookingType ?? 'Instant'),
                    iconName: 'flash-outline' as const,
                    isWide: false,
                  },
                  {
                    key: 'status',
                    value: getBookingStatusLabel(details),
                    iconName: 'checkmark-circle-outline' as const,
                    isWide: false,
                  },
                  {
                    key: 'schedule',
                    value: formatBookingDateTime(details.booking.scheduledStartAt),
                    iconName: 'time-outline' as const,
                    isWide: true,
                  },
                ].map(row => (
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
                {[
                  {
                    key: 'customer',
                    value: getBookingUserName(details.customerInfo?.user),
                    iconName: 'person-outline' as const,
                  },
                  {
                    key: 'address',
                    value: formatBookingAddress(details.address),
                    iconName: 'location-outline' as const,
                  },
                ].map(row => (
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
              }}
            >
              <Text className="text-base font-extrabold text-primary">
                {getBookingUserName(details.customerInfo?.user).charAt(0).toUpperCase()}
              </Text>
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-base font-extrabold text-baseDark dark:text-white" numberOfLines={1}>
                {getBookingUserName(details.customerInfo?.user)}
              </Text>
              <Text
                className="mt-0.5 text-xs font-semibold"
                numberOfLines={1}
                style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
              >
                Customer
              </Text>
            </View>

            {details.customerInfo?.user?.phone ? (
              <Pressable
                onPress={() => {
                  void Linking.openURL(`tel:${details.customerInfo?.user?.phone}`);
                }}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.accentSoft20 }}
              >
                <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
              </Pressable>
            ) : null}
          </View>

          <ScrollablePillTabs
            items={[...JOB_DETAILS_TABS]}
            value={activeTab}
            onChange={setActiveTab}
          />

          {renderTabContent()}

          {canAcceptReject && activeTab === 'BILL' ? (
            <View className="mt-4 flex-row items-center" style={{ gap: 10 }}>
              <View className="flex-1">
                <Button
                  label={inviteActionLoading === 'REJECTED' ? 'Rejecting...' : 'Reject'}
                  variant="secondary"
                  onPress={() => void onReject()}
                  disabled={Boolean(inviteActionLoading)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={inviteActionLoading === 'ACCEPTED' ? 'Accepting...' : 'Accept'}
                  onPress={() => void onAccept()}
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
