import { useMemo, useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { MAIN_TAB_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import {
  buildAddressSummary,
  formatBookingTypeLabel,
  formatPriceOptionAmount,
} from '@/utils/booking-flow';
import { palette, theme, uiColors } from '@/utils/theme';

type BookingConfirmationScreenProps = {
  navigation: {
    goBack: () => void;
    popToTop: () => void;
    navigate: (screen: string, params?: unknown) => void;
    getParent: () => { navigate: (screen: string, params?: unknown) => void } | undefined;
  };
};

export function BookingConfirmationScreen({ navigation }: BookingConfirmationScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { locationState } = useAuthContext();
  const {
    categoryName,
    subcategoryName,
    selectedServices,
    bookingType,
    scheduledDate,
    scheduledTime,
    address,
    notes,
    createBooking,
    resetFlow,
  } = useBookingFlowContext();
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const selectedCity = useMemo(() => {
    return locationState.city?.trim() || address.district.trim();
  }, [address.district, locationState.city]);

  const scheduleLabel = bookingType === 'INSTANT'
    ? APP_TEXT.main.bookingFlow.instantScheduleLabel
    : `${scheduledDate} at ${scheduledTime}`;

  const summaryRows = useMemo(
    () => [
      { label: APP_TEXT.main.bookingFlow.summaryCategory, value: categoryName ?? '-' },
      { label: APP_TEXT.main.bookingFlow.subcategoryLabel, value: subcategoryName ?? '-' },
      { label: APP_TEXT.main.bookingFlow.summaryBookingType, value: formatBookingTypeLabel(bookingType) },
      { label: APP_TEXT.main.bookingFlow.summarySlot, value: scheduleLabel },
      { label: APP_TEXT.main.bookingFlow.summaryAddress, value: buildAddressSummary(address) || '-' },
      { label: APP_TEXT.main.bookingFlow.summaryNotes, value: notes || APP_TEXT.main.bookingFlow.noNotes },
    ],
    [address, bookingType, categoryName, notes, scheduleLabel, subcategoryName],
  );

  const onConfirm = async () => {
    if (confirming || bookingCode || !selectedCity) return;
    setConfirming(true);
    try {
      const result = await createBooking(selectedCity);
      setBookingCode(result.booking?.bookingCode ?? null);
      setBookingId(result.booking?.id ?? null);
      setBookingStatus(result.booking?.bookingStatus ?? null);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <GradientScreen contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}>
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} visible={!bookingCode} />
      </View>

      <SplitGradientTitle
        eyebrow={APP_TEXT.main.bookingFlow.confirmEyebrow}
        prefix={bookingCode ? APP_TEXT.main.bookingFlow.doneTitle : APP_TEXT.main.bookingFlow.confirmTitle}
        highlight={categoryName ?? ''}
        subtitle={bookingCode ? APP_TEXT.main.bookingFlow.doneSubtitle : APP_TEXT.main.bookingFlow.detailsSubtitle}
        prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
        highlightClassName="text-4xl font-extrabold leading-[40px]"
        subtitleClassName="mt-2 text-sm"
        showSparkle={false}
      />

      <View className="mt-4 rounded-[28px] border p-4" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
        {summaryRows.map(row => (
          <View key={row.label} className="mb-3">
            <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>{row.label}</Text>
            <Text className="mt-1 text-sm font-bold text-baseDark dark:text-white">{row.value}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4 gap-3">
        {selectedServices.map((line) => {
          const selectedOption = line.service.priceOptions?.find(option => option.id === line.selectedPriceOptionId);
          return (
            <View
              key={line.service.id}
              className="rounded-[24px] border p-4"
              style={{
                borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
              }}
            >
              <Text className="text-base font-extrabold text-baseDark dark:text-white">{line.service.name}</Text>
              <Text className="mt-2 text-xs font-semibold text-primary">{APP_TEXT.main.bookingFlow.quantitySummaryPrefix}: {line.quantity}</Text>
              {selectedOption ? (
                <>
                  <Text className="mt-2 text-sm font-bold text-baseDark dark:text-white">{selectedOption.title}</Text>
                  <Text className="mt-1 text-xs font-semibold text-primary">{formatPriceOptionAmount(selectedOption)}</Text>
                </>
              ) : null}
            </View>
          );
        })}
      </View>

      {bookingCode ? (
        <View className="mt-4 rounded-[24px] border p-4" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}>
          <Text className="text-sm font-bold text-primary">
            {APP_TEXT.main.bookingFlow.doneBookingIdPrefix}: {bookingCode}
          </Text>
          {bookingStatus ? (
            <Text className="mt-2 text-xs font-semibold text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.statusPrefix}: {bookingStatus}</Text>
          ) : null}
          {bookingId ? (
            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.main.bookingFlow.referencePrefix}: {bookingId}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="mt-6">
        {!bookingCode ? (
          <Button label={APP_TEXT.main.bookingFlow.confirmCta} onPress={() => void onConfirm()} loading={confirming} />
        ) : (
          <>
            <Button
              label={APP_TEXT.main.bookingFlow.goBookings}
              onPress={() => {
                resetFlow();
                navigation.getParent()?.navigate(MAIN_TAB_SCREEN.BOOKINGS);
              }}
            />
            <View className="mt-2">
              <Button
                label={APP_TEXT.main.bookingFlow.backHome}
                variant="secondary"
                onPress={() => {
                  resetFlow();
                  navigation.popToTop();
                  navigation.getParent()?.navigate(MAIN_TAB_SCREEN.HOME);
                }}
              />
            </View>
          </>
        )}
      </View>
    </GradientScreen>
  );
}
