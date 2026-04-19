import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { AppInput } from '@/components/common/AppInput';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { HOME_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { bookingSlotOptions, type BookingSlotValue } from '@/utils/options';
import { palette, theme, uiColors } from '@/utils/theme';

type BookingDetailsScreenProps = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: unknown) => void;
  };
};

export function BookingDetailsScreen({ navigation }: BookingDetailsScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const {
    categoryName,
    subcategoryName,
    selectedServices,
    slotValue: contextSlotValue,
    address: contextAddress,
    notes: contextNotes,
    setBookingDetails,
  } = useBookingFlowContext();

  const [selectedSlot, setSelectedSlot] = useState<BookingSlotValue>(contextSlotValue);
  const [address, setAddress] = useState(contextAddress);
  const [notes, setNotes] = useState(contextNotes);

  const slotLabel = useMemo(
    () => bookingSlotOptions.find(slot => slot.value === selectedSlot)?.label ?? bookingSlotOptions[0].label,
    [selectedSlot],
  );
  const canReview = address.trim().length > 0 && selectedServices.length > 0;

  return (
    <GradientScreen contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}>
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <SplitGradientTitle
        eyebrow={APP_TEXT.main.bookingFlow.detailsEyebrow}
        prefix={APP_TEXT.main.bookingFlow.detailsTitle}
        highlight={categoryName ?? ''}
        subtitle={APP_TEXT.main.bookingFlow.detailsSubtitle}
        prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
        highlightClassName="text-4xl font-extrabold leading-[40px]"
        subtitleClassName="mt-2 text-sm"
        showSparkle={false}
      />

      <View className="mt-4 rounded-2xl border p-4" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
        {subcategoryName ? (
          <>
            <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>{APP_TEXT.main.bookingFlow.subcategoryLabel}</Text>
            <Text className="mt-1 text-sm font-bold text-baseDark dark:text-white">{subcategoryName}</Text>
          </>
        ) : null}
        <Text className="mt-3 text-xs font-semibold" style={{ color: theme.colors.primary }}>{APP_TEXT.main.bookingFlow.servicesLabel}</Text>
        <Text className="mt-1 text-sm font-bold text-baseDark dark:text-white">
          {selectedServices.map(service => service.name).join(', ')}
        </Text>
      </View>

      <Text className="mt-5 text-sm font-bold text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.slotLabel}</Text>
      <View className="mt-2 gap-2">
        {bookingSlotOptions.map(slot => {
          const selected = selectedSlot === slot.value;
          return (
            <Pressable
              key={slot.value}
              onPress={() => setSelectedSlot(slot.value)}
              className="rounded-2xl border px-3 py-3"
              style={{
                borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                backgroundColor: selected ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
              }}
            >
              <Text className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-baseDark dark:text-white'}`}>
                {slot.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-5">
        <AppInput
          label={APP_TEXT.main.bookingFlow.addressLabel}
          isRequired
          value={address}
          onChangeText={setAddress}
          placeholder={APP_TEXT.main.bookingFlow.addressPlaceholder}
        />
      </View>

      <View className="mt-4">
        <AppInput
          label={APP_TEXT.main.bookingFlow.notesLabel}
          value={notes}
          onChangeText={setNotes}
          placeholder={APP_TEXT.main.bookingFlow.notesPlaceholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View className="mt-6">
        <Button
          label={APP_TEXT.main.bookingFlow.reviewCta}
          disabled={!canReview}
          onPress={() => {
            if (!canReview) return;
            setBookingDetails({
              slotValue: selectedSlot,
              slotLabel,
              address: address.trim(),
              notes: notes.trim(),
            });
            navigation.navigate(HOME_SCREEN.BOOKING_CONFIRMATION);
          }}
        />
      </View>
    </GradientScreen>
  );
}
