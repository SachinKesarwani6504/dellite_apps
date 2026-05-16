import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import { BookingDetailsAssignmentStatusTab } from '@/components/booking-details/BookingDetailsAssignmentStatusTab';
import { BookingDetailsBillTab } from '@/components/booking-details/BookingDetailsBillTab';
import { BookingDetailsLiveLocationTab } from '@/components/booking-details/BookingDetailsLiveLocationTab';
import { BookingDetailsPaymentTab } from '@/components/booking-details/BookingDetailsPaymentTab';
import { BookingDetailsServicesTab } from '@/components/booking-details/BookingDetailsServicesTab';
import { BookingDetailsWorkerCard } from '@/components/booking-details/BookingDetailsWorkerCard';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { LoadingState } from '@/components/common/LoadingState';
import { ScrollablePillTabs } from '@/components/common/ScrollablePillTabs';
import { BookingDetailsProvider, useBookingDetailsContext } from '@/contexts/BookingDetailsContext';
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
  const refreshControlProps = useBrandRefreshControl(refresh);
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
            <Button label="Retry" variant="secondary" onPress={() => void refresh()} />
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

          <BookingDetailsWorkerCard />

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
