import { useMemo, useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { HOME_SCREEN, MAIN_TAB_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

type BookingConfirmationScreenProps = {
  navigation: {
    goBack: () => void;
    popToTop: () => void;
    navigate: (screen: string, params?: unknown) => void;
    getParent: () => { navigate: (screen: string, params?: unknown) => void } | undefined;
  };
};

function buildBookingId() {
  return `DLT-${Math.floor(100000 + Math.random() * 900000).toString()}`;
}

export function BookingConfirmationScreen({ navigation }: BookingConfirmationScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const {
    categoryName,
    subcategoryName,
    selectedServices,
    slotLabel,
    address,
    notes,
    resetFlow,
  } = useBookingFlowContext();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const summaryRows = useMemo(
    () => [
      { label: APP_TEXT.main.bookingFlow.summaryCategory, value: categoryName ?? '-' },
      { label: APP_TEXT.main.bookingFlow.subcategoryLabel, value: subcategoryName ?? '-' },
      { label: APP_TEXT.main.bookingFlow.servicesLabel, value: selectedServices.map(service => service.name).join(', ') || '-' },
      { label: APP_TEXT.main.bookingFlow.summarySlot, value: slotLabel },
      { label: APP_TEXT.main.bookingFlow.summaryAddress, value: address || '-' },
      { label: APP_TEXT.main.bookingFlow.summaryNotes, value: notes || APP_TEXT.main.bookingFlow.noNotes },
    ],
    [address, categoryName, notes, selectedServices, slotLabel, subcategoryName],
  );

  const onConfirm = async () => {
    if (confirming || bookingId) return;
    setConfirming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setBookingId(buildBookingId());
    } finally {
      setConfirming(false);
    }
  };

  return (
    <GradientScreen contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}>
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} visible={!bookingId} />
      </View>

      <SplitGradientTitle
        eyebrow={APP_TEXT.main.bookingFlow.confirmEyebrow}
        prefix={bookingId ? APP_TEXT.main.bookingFlow.doneTitle : APP_TEXT.main.bookingFlow.confirmTitle}
        highlight={categoryName ?? ''}
        subtitle={bookingId ? APP_TEXT.main.bookingFlow.doneSubtitle : APP_TEXT.main.bookingFlow.detailsSubtitle}
        prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
        highlightClassName="text-4xl font-extrabold leading-[40px]"
        subtitleClassName="mt-2 text-sm"
        showSparkle={false}
      />

      <View className="mt-4 rounded-2xl border p-4" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
        {summaryRows.map(row => (
          <View key={row.label} className="mb-3">
            <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>{row.label}</Text>
            <Text className="mt-1 text-sm font-bold text-baseDark dark:text-white">{row.value}</Text>
          </View>
        ))}
      </View>

      {bookingId ? (
        <View className="mt-4 rounded-2xl border p-4" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}>
          <Text className="text-sm font-bold text-primary">
            {APP_TEXT.main.bookingFlow.doneBookingIdPrefix}: {bookingId}
          </Text>
        </View>
      ) : null}

      <View className="mt-6">
        {!bookingId ? (
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
                  navigation.navigate(HOME_SCREEN.HOME);
                }}
              />
            </View>
          </>
        )}
      </View>
    </GradientScreen>
  );
}
