import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { WorkerBookingRouteMap } from '@/components/common/WorkerBookingRouteMap';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingLiveRoute } from '@/hooks/useBookingLiveRoute';
import { useBookingDetailsController } from '@/hooks/useBookingDetailsController';
import { JobStackParamList } from '@/types/navigation';
import { APP_TEXT } from '@/utils/appText';
import {
  formatBookingAddress,
  formatBookingDateTime,
  formatBookingDuration,
  formatBookingMoney,
  getBookingLineDurationMinutes,
  getBookingLineKey,
  getBookingLineQuantity,
  getBookingMapDestinationCoordinates,
  getBookingStatusLabel,
  getBookingUserName,
  getGoogleMapsDirectionsUrl,
  getWorkerRouteOriginCoordinates,
  isBookingHourlyLine,
  titleCaseBookingValue,
} from '@/utils/booking-details';
import { palette, theme, uiColors } from '@/utils/theme';

export function JobDetailsScreen({ navigation, route }: NativeStackScreenProps<JobStackParamList, 'JobDetails'>) {
  const isDark = useColorScheme() === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const { locationState } = useAuthContext();
  const {
    details,
    loading,
    error,
    updatingLineKey,
    refetch,
    increaseQuantity,
    decreaseQuantity,
    increaseDuration,
    decreaseDuration,
  } = useBookingDetailsController(route.params.jobId, 'WORKER');
  const { refreshProps } = useBrandRefreshControlProps();
  const refreshDetails = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  const cardStyle = {
    backgroundColor: isDark ? palette.dark.card : palette.light.card,
    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight,
  };
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const customerName = getBookingUserName(details?.customerInfo?.user);
  const originCoordinates = getWorkerRouteOriginCoordinates(locationState.latitude, locationState.longitude);
  const destinationCoordinates = getBookingMapDestinationCoordinates(details?.address);
  const routeState = useBookingLiveRoute({
    origin: originCoordinates,
    destination: destinationCoordinates,
    vehicleMode: 'CAR',
    enabled: Boolean(details),
  });
  const openGoogleMaps = useCallback(() => {
    void Linking.openURL(getGoogleMapsDirectionsUrl(destinationCoordinates));
  }, [destinationCoordinates.latitude, destinationCoordinates.longitude]);

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
      refreshControl={<RefreshControl {...refreshProps} refreshing={refreshing} onRefresh={() => void refreshDetails()} />}
    >
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <Text className="text-[30px] font-extrabold leading-[34px] text-baseDark dark:text-white">
        {APP_TEXT.jobs.detailsTitle}
      </Text>
      <Text className="mt-2 text-sm" style={{ color: mutedTextColor }}>
        {APP_TEXT.jobs.detailsSubtitle}
      </Text>

      {loading && !details ? (
        <View className="mt-8 items-center rounded-2xl border p-6" style={cardStyle}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text className="mt-3 text-sm font-semibold" style={{ color: mutedTextColor }}>Loading job details...</Text>
        </View>
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
          <View className="mt-5 overflow-hidden rounded-2xl border" style={cardStyle}>
            <View className="flex-row items-center justify-between px-4 py-4" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmCardLight }}>
              <View className="mr-3 flex-1">
                <Text className="text-xs font-extrabold uppercase" style={{ color: mutedTextColor }}>
                  {details.booking.bookingCode ?? details.booking.id}
                </Text>
                <Text className="mt-1 text-2xl font-extrabold text-baseDark dark:text-white">
                  {getBookingStatusLabel(details)}
                </Text>
              </View>
              <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: theme.colors.primary }}>
                <Text className="text-xs font-extrabold text-white">{formatBookingMoney(details.booking.totalAmount)}</Text>
              </View>
            </View>

            <View className="gap-3 p-4">
              <View className="flex-row items-center justify-between">
                <View className="mr-3 flex-row items-center">
                  <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
                  <Text className="ml-2 text-sm font-semibold" style={{ color: mutedTextColor }}>Customer</Text>
                </View>
                <Text className="flex-1 text-right text-sm font-extrabold text-baseDark dark:text-white">{customerName}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="mr-3 flex-row items-center">
                  <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                  <Text className="ml-2 text-sm font-semibold" style={{ color: mutedTextColor }}>Schedule</Text>
                </View>
                <Text className="flex-1 text-right text-sm font-extrabold text-baseDark dark:text-white">
                  {formatBookingDateTime(details.booking.scheduledStartAt)}
                </Text>
              </View>

              <View className="flex-row items-start justify-between">
                <View className="mr-3 flex-row items-center">
                  <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                  <Text className="ml-2 text-sm font-semibold" style={{ color: mutedTextColor }}>Address</Text>
                </View>
                <Text className="flex-1 text-right text-sm font-extrabold leading-5 text-baseDark dark:text-white">
                  {formatBookingAddress(details.address)}
                </Text>
              </View>
            </View>
          </View>

          <WorkerBookingRouteMap
            originCoordinates={originCoordinates}
            destinationCoordinates={destinationCoordinates}
            route={routeState.route}
            isDark={isDark}
            loading={routeState.loading}
            error={routeState.error}
            onOpenMaps={openGoogleMaps}
          />

          <View className="mt-5">
            <Text className="text-xs font-extrabold uppercase text-baseDark dark:text-white">
              Work Lines
            </Text>
            <View className="mt-3 gap-3">
              {(details.serviceLines ?? []).map(line => {
                const lineKey = getBookingLineKey(line);
                const isUpdating = updatingLineKey === lineKey;
                const quantity = getBookingLineQuantity(line);
                const durationMinutes = getBookingLineDurationMinutes(line);
                const hourly = isBookingHourlyLine(line);

                return (
                  <View key={lineKey} className="rounded-2xl border p-4" style={cardStyle}>
                    <View className="flex-row items-start justify-between">
                      <View className="mr-3 flex-1">
                        <Text className="text-lg font-extrabold text-baseDark dark:text-white">
                          {titleCaseBookingValue(line.serviceName)}
                        </Text>
                        <Text className="mt-1 text-xs font-semibold" style={{ color: mutedTextColor }}>
                          {titleCaseBookingValue(line.categoryName ?? line.subCategoryName)}
                        </Text>
                      </View>
                      <Text className="text-lg font-extrabold text-primary">
                        {formatBookingMoney(line.lineTotalAmount)}
                      </Text>
                    </View>

                    <View className="mt-4 flex-row flex-wrap" style={{ gap: 10 }}>
                      <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.neutralSoftLight }}>
                        <Text className="text-[11px] font-extrabold uppercase" style={{ color: mutedTextColor }}>Quantity</Text>
                        <View className="mt-2 flex-row items-center justify-between">
                          <Pressable
                            disabled={isUpdating || quantity <= 1}
                            onPress={() => void decreaseQuantity(line)}
                            className="h-9 w-9 items-center justify-center rounded-full"
                            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : palette.light.card }}
                          >
                            <Ionicons name="remove" size={17} color={theme.colors.primary} />
                          </Pressable>
                          <Text className="text-lg font-extrabold text-baseDark dark:text-white">{quantity}</Text>
                          <Pressable
                            disabled={isUpdating}
                            onPress={() => void increaseQuantity(line)}
                            className="h-9 w-9 items-center justify-center rounded-full"
                            style={{ backgroundColor: theme.colors.primary }}
                          >
                            <Ionicons name="add" size={17} color={theme.colors.onPrimary} />
                          </Pressable>
                        </View>
                      </View>

                      {hourly ? (
                        <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.neutralSoftLight }}>
                          <Text className="text-[11px] font-extrabold uppercase" style={{ color: mutedTextColor }}>Duration</Text>
                          <View className="mt-2 flex-row items-center justify-between">
                            <Pressable
                              disabled={isUpdating || (durationMinutes ?? 0) <= 30}
                              onPress={() => void decreaseDuration(line)}
                              className="h-9 w-9 items-center justify-center rounded-full"
                              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : palette.light.card }}
                            >
                              <Ionicons name="remove" size={17} color={theme.colors.primary} />
                            </Pressable>
                            <Text className="text-base font-extrabold text-baseDark dark:text-white">{formatBookingDuration(durationMinutes)}</Text>
                            <Pressable
                              disabled={isUpdating}
                              onPress={() => void increaseDuration(line)}
                              className="h-9 w-9 items-center justify-center rounded-full"
                              style={{ backgroundColor: theme.colors.primary }}
                            >
                              <Ionicons name="add" size={17} color={theme.colors.onPrimary} />
                            </Pressable>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    {isUpdating ? (
                      <Text className="mt-3 text-xs font-semibold" style={{ color: mutedTextColor }}>Updating latest payout...</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View className="mt-5 rounded-2xl border p-4" style={cardStyle}>
            <Text className="text-xs font-extrabold uppercase" style={{ color: mutedTextColor }}>Payout Summary</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-baseDark dark:text-white">Booking total</Text>
              <Text className="text-sm font-extrabold text-baseDark dark:text-white">{formatBookingMoney(details.booking.totalAmount)}</Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-baseDark dark:text-white">Commission</Text>
              <Text className="text-sm font-extrabold text-primary">{formatBookingMoney(details.booking.bookingCommissionAmount)}</Text>
            </View>
            {(details.commissions ?? []).map(commission => (
              <View key={commission.id ?? commission.bookingServiceLineId ?? commission.commissionAmount?.toString()} className="mt-2 flex-row items-center justify-between">
                <Text className="mr-3 flex-1 text-xs font-semibold" style={{ color: mutedTextColor }}>
                  {titleCaseBookingValue(commission.commissionType)}
                </Text>
                <Text className="text-xs font-extrabold text-baseDark dark:text-white">
                  {formatBookingMoney(commission.commissionAmount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </GradientScreen>
  );
}
