import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { AppInput } from '@/components/common/AppInput';
import { BackButton } from '@/components/common/BackButton';
import { BookingServiceDetailCard } from '@/components/common/BookingServiceDetailCard';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import { HOME_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import {
  buildAddressSummary,
  buildDetectedAddressDraft,
  buildLocationPrimaryLine,
  buildScheduledStartAt,
  getServiceLineTotalAmount,
  getSelectedPriceOption,
  isBookingAddressComplete,
  titleCase,
} from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type BookingDetailsScreenProps = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: unknown) => void;
  };
};

type DateChoice = {
  value: string;
  topLabel: string;
  dayOfMonth: string;
  monthLabel: string;
};

function buildNextFiveDays(): DateChoice[] {
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = date.toISOString().slice(0, 10);
    return {
      value,
      topLabel: index === 0
        ? 'TODAY'
        : new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date).toUpperCase(),
      dayOfMonth: new Intl.DateTimeFormat('en-IN', { day: 'numeric' }).format(date),
      monthLabel: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date),
    };
  });
}

function buildHalfHourTimeOptions() {
  const options: string[] = [];
  for (let hour = 6; hour <= 23; hour += 1) {
    for (let minute = 0; minute <= 30; minute += 30) {
      if (hour === 23 && minute > 30) continue;
      const hourLabel = String(hour).padStart(2, '0');
      const minuteLabel = String(minute).padStart(2, '0');
      options.push(`${hourLabel}:${minuteLabel}`);
    }
  }
  return options;
}

function formatTimeChipLabel(value: string) {
  const [hours = '09', minutes = '00'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(date);
}

function BookingTypeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center rounded-lg px-4 py-3"
      style={{
        backgroundColor: selected ? theme.colors.primary : 'transparent',
      }}
    >
      <View
        className="mr-2 h-4 w-4 items-center justify-center rounded-full border"
        style={{ borderColor: selected ? '#FFFFFF' : '#9CA3AF' }}
      >
        {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
      </View>
      <Text className={`text-sm font-bold ${selected ? 'text-white' : 'text-baseDark dark:text-white'}`} style={selected ? undefined : { opacity: 0.75 }}>{label}</Text>
    </Pressable>
  );
}

export function BookingDetailsScreen({ navigation }: BookingDetailsScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { locationState } = useAuthContext();
  const {
    city,
    locality,
    state,
    country,
    postalCode,
    formattedAddress,
    latitude,
    longitude,
    refreshLocation,
    refreshing: locationRefreshing,
    error: locationError,
  } = locationState;
  const {
    categoryName,
    selectedServices,
    bookingType: contextBookingType,
    scheduledDate: contextScheduledDate,
    scheduledTime: contextScheduledTime,
    address: contextAddress,
    notes: contextNotes,
    setServicePriceOption,
    setServiceQuantity,
    removeService,
    setBookingDetails,
  } = useBookingFlowContext();

  const [bookingType, setBookingType] = useState(contextBookingType);
  const [scheduledDate, setScheduledDate] = useState(contextBookingType === 'SCHEDULED' ? contextScheduledDate : '');
  const [scheduledTime, setScheduledTime] = useState(contextScheduledTime);
  const [addressDraft, setAddressDraft] = useState(contextAddress);
  const [notes, setNotes] = useState(contextNotes);
  const [selectedDurationByService, setSelectedDurationByService] = useState<Record<string, number>>({});

  const dateChoices = useMemo(buildNextFiveDays, []);
  const timeOptions = useMemo(buildHalfHourTimeOptions, []);

  const resolvedLocation = useMemo(() => resolveProductLocation({
    city,
    locality,
    state,
    formattedAddress,
    latitude,
    longitude,
  }), [city, formattedAddress, latitude, locality, longitude, state]);

  const detectedAddressDraft = useMemo(() => buildDetectedAddressDraft({
    city,
    locality,
    state,
    country,
    postalCode,
    formattedAddress,
    latitude,
    longitude,
  }), [city, country, formattedAddress, latitude, locality, longitude, postalCode, state]);

  useEffect(() => {
    if (detectedAddressDraft.addressLine1.trim().length === 0) {
      return;
    }

    setAddressDraft((current) => {
      if (current.mode === 'pin' && current.addressLine1.trim().length > 0) {
        return current;
      }

      return {
        ...detectedAddressDraft,
        mode: current.mode || 'google',
        addressLine2: current.addressLine2,
      };
    });
  }, [detectedAddressDraft]);

  useEffect(() => {
    if (scheduledDate && !dateChoices.some(choice => choice.value === scheduledDate)) {
      setScheduledDate('');
      setScheduledTime('');
    }
  }, [dateChoices, scheduledDate]);

  useEffect(() => {
    selectedServices.forEach((line) => {
      if (line.selectedPriceOptionId) return;
      if (!Array.isArray(line.service.priceOptions) || line.service.priceOptions.length === 0) return;
      const [defaultOption] = line.service.priceOptions;
      if (defaultOption?.id) {
        setServicePriceOption(line.service.id, defaultOption.id);
      }
    });
  }, [selectedServices, setServicePriceOption]);

  useEffect(() => {
    selectedServices.forEach((line) => {
      const selectedPriceOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
      const allowedDurations = selectedPriceOption?.allowedDurations;
      if (
        !selectedPriceOption?.isDurationSelectable
        || !Array.isArray(allowedDurations)
        || allowedDurations.length === 0
      ) {
        return;
      }
      const existingSelection = selectedDurationByService[line.service.id];
      const defaultDuration = typeof existingSelection === 'number' ? existingSelection : allowedDurations[0];
      if (existingSelection !== defaultDuration) {
        setSelectedDurationByService(prev => ({ ...prev, [line.service.id]: defaultDuration }));
      }
      const billingUnit = selectedPriceOption.billingUnitMinutes && selectedPriceOption.billingUnitMinutes > 0
        ? selectedPriceOption.billingUnitMinutes
        : null;
      if (!billingUnit) return;
      const nextQuantity = Math.max(1, Math.ceil(defaultDuration / billingUnit));
      if (nextQuantity !== line.quantity) {
        setServiceQuantity(line.service.id, nextQuantity);
      }
    });
  }, [selectedDurationByService, selectedServices, setServiceQuantity]);

  const hasMissingPriceSelection = selectedServices.some(line =>
    Array.isArray(line.service.priceOptions)
    && line.service.priceOptions.length > 0
    && !line.selectedPriceOptionId,
  );

  const hasValidSchedule = bookingType === 'INSTANT' || Boolean(buildScheduledStartAt(scheduledDate, scheduledTime));
  const canReview = selectedServices.length > 0
    && !hasMissingPriceSelection
    && isBookingAddressComplete(addressDraft)
    && hasValidSchedule;

  const currentLocationSummary = buildAddressSummary(detectedAddressDraft) || APP_TEXT.main.bookingFlow.currentLocationEmptyHint;
  const currentLocationPrimaryLine = buildLocationPrimaryLine(detectedAddressDraft) || resolvedLocation.displayCity || 'Location not ready';

  return (
    <GradientScreen contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12 }}>
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <SplitGradientTitle
        eyebrow={APP_TEXT.main.bookingFlow.detailsEyebrow}
        prefix="Book your"
        highlight={categoryName ? titleCase(categoryName) : ''}
        wrapHighlight
      />

      <View
        className="mt-5 flex-row rounded-xl p-1"
        style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
      >
        <BookingTypeChip
          label={APP_TEXT.main.bookingFlow.instantBookingLabel}
          selected={bookingType === 'INSTANT'}
          onPress={() => {
            setBookingType('INSTANT');
            setScheduledDate('');
            setScheduledTime('');
          }}
        />
        <BookingTypeChip
          label={APP_TEXT.main.bookingFlow.scheduledBookingLabel}
          selected={bookingType === 'SCHEDULED'}
          onPress={() => setBookingType('SCHEDULED')}
        />
      </View>

      {bookingType === 'SCHEDULED' ? (
        <>
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-baseDark dark:text-white">Select date</Text>
            <Text className="text-[11px] font-semibold uppercase text-textPrimary/60 dark:text-white/60">Next 5 days</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 2, gap: 10 }}
          >
            {dateChoices.map((choice) => {
              const selected = scheduledDate === choice.value;
              return (
                <Pressable
                  key={choice.value}
                  onPress={() => {
                    setScheduledDate(choice.value);
                    if (!scheduledTime) {
                      setScheduledTime('06:00');
                    }
                  }}
                  className="min-w-[88px] rounded-lg border px-3 py-3"
                  style={{
                    borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                    backgroundColor: selected ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95),
                  }}
                >
                  <Text className={`text-[10px] font-bold uppercase ${selected ? 'text-primary' : 'text-textPrimary/70 dark:text-white/70'}`}>{choice.topLabel}</Text>
                  <Text className="mt-1 text-2xl font-extrabold text-baseDark dark:text-white">{choice.dayOfMonth}</Text>
                  <Text className="text-xs text-textPrimary/70 dark:text-white/70">{choice.monthLabel}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {scheduledDate ? (
            <>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-baseDark dark:text-white">Select time slot</Text>
                <Text className="text-[11px] font-semibold uppercase text-textPrimary/60 dark:text-white/60">Available slots</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 2, gap: 10 }}
              >
                {timeOptions.map((timeOption) => {
                  const selected = scheduledTime === timeOption;
                  return (
                    <Pressable
                      key={timeOption}
                      onPress={() => setScheduledTime(timeOption)}
                      className="rounded-full border px-4 py-2.5"
                      style={{
                        borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                        backgroundColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95),
                      }}
                    >
                      <Text className={`text-xs font-bold ${selected ? 'text-white' : 'text-baseDark dark:text-white'}`}>
                        {formatTimeChipLabel(timeOption)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : null}
        </>
      ) : null}

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.selectedServicesTitle}</Text>
        <Text className="text-xs font-semibold text-textPrimary/60 dark:text-white/60">{selectedServices.length} item</Text>
      </View>
      <View className="mt-3 gap-3">
        {selectedServices.map((line) => {
          const selectedPriceOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
          const lineTotalAmount = getServiceLineTotalAmount(line.service, line.selectedPriceOptionId, line.quantity);
          const unitPriceAmount = typeof selectedPriceOption?.price === 'number'
            ? selectedPriceOption.price
            : (typeof selectedPriceOption?.amount === 'number' ? selectedPriceOption.amount : null);

          return (
            <BookingServiceDetailCard
              key={line.service.id}
              service={line.service}
              selectedPriceOption={selectedPriceOption}
              selectedPriceOptionId={line.selectedPriceOptionId}
              quantity={line.quantity}
              unitPriceAmount={unitPriceAmount}
              lineTotalAmount={lineTotalAmount}
              isDark={isDark}
              selectedDurationMinutes={selectedDurationByService[line.service.id] ?? null}
              onSelectPriceOption={(priceOptionId) => {
                setServicePriceOption(line.service.id, priceOptionId);
              }}
              onSelectDurationMinutes={(minutes) => {
                setSelectedDurationByService(prev => ({ ...prev, [line.service.id]: minutes }));
                const priceOption = line.service.priceOptions?.find(option => option.id === line.selectedPriceOptionId);
                const billingUnit = priceOption?.billingUnitMinutes && priceOption.billingUnitMinutes > 0
                  ? priceOption.billingUnitMinutes
                  : null;
                if (!billingUnit) return;
                const nextQuantity = Math.max(1, Math.ceil(minutes / billingUnit));
                setServiceQuantity(line.service.id, nextQuantity);
              }}
              onDecreaseQuantity={() => setServiceQuantity(line.service.id, line.quantity - 1)}
              onIncreaseQuantity={() => setServiceQuantity(line.service.id, line.quantity + 1)}
              onRemoveService={() => removeService(line.service.id)}
            />
          );
        })}
      </View>

      <Text className="mt-6 text-sm font-bold text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.locationTitle}</Text>
      <View
        className="mt-3 rounded-lg border p-4"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        }}
      >
        <Pressable
          onPress={() => {
            void refreshLocation();
            setAddressDraft({
              ...detectedAddressDraft,
              mode: 'google',
              addressLine2: addressDraft.addressLine2,
            });
          }}
        >
          <Text className="text-sm font-bold text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.locationCurrentTitle}</Text>
          <View
            className="mt-3 rounded-md border px-3 py-3"
            style={{
              borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="mr-3 flex-1">
                <Text className="text-[11px] font-semibold uppercase text-primary">{APP_TEXT.main.bookingFlow.currentLocationSummaryTitle}</Text>
                <Text className="mt-1 text-sm font-bold text-baseDark dark:text-white">{titleCase(currentLocationPrimaryLine)}</Text>
              </View>
              <Text className="text-xs font-bold text-primary">
                {locationRefreshing ? APP_TEXT.main.bookingFlow.refreshingLocationLabel : APP_TEXT.main.bookingFlow.useCurrentLocationCta}
              </Text>
            </View>
            <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {currentLocationSummary}
            </Text>
            {locationError ? (
              <Text className="mt-2 text-xs" style={{ color: theme.colors.negative }}>
                {locationError}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <View className="my-4 flex-row items-center">
          <View className="h-px flex-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />
          <Text className="mx-3 text-[10px] font-semibold uppercase text-textPrimary/60 dark:text-white/60">OR</Text>
          <View className="h-px flex-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />
        </View>

        <Pressable onPress={() => setAddressDraft(current => ({ ...current, mode: 'pin' }))}>
          <Text className="text-sm font-bold text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.locationManualTitle}</Text>
          <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {APP_TEXT.main.bookingFlow.locationManualSubtitle}
          </Text>
        </Pressable>

        {addressDraft.mode === 'pin' ? (
          <View className="mt-4 gap-3">
            <AppInput
              label={APP_TEXT.main.bookingFlow.addressLine1Label}
              isRequired
              value={addressDraft.addressLine1}
              onChangeText={(value) => setAddressDraft(current => ({ ...current, addressLine1: value }))}
              placeholder={APP_TEXT.main.bookingFlow.addressPlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.addressLine2Label}
              value={addressDraft.addressLine2}
              onChangeText={(value) => setAddressDraft(current => ({ ...current, addressLine2: value }))}
              placeholder={APP_TEXT.main.bookingFlow.addressLine2Placeholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.areaLabel}
              isRequired
              value={addressDraft.area}
              onChangeText={(value) => setAddressDraft(current => ({ ...current, area: value }))}
              placeholder={APP_TEXT.main.bookingFlow.areaPlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.districtLabel}
              isRequired
              value={addressDraft.district}
              onChangeText={(value) => setAddressDraft(current => ({ ...current, district: value }))}
              placeholder={APP_TEXT.main.bookingFlow.districtPlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.stateFieldLabel}
              isRequired
              value={addressDraft.state}
              onChangeText={(value) => setAddressDraft(current => ({ ...current, state: value }))}
              placeholder={APP_TEXT.main.bookingFlow.statePlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.pincodeLabel}
              isRequired
              value={addressDraft.pincode}
              onChangeText={(value) => setAddressDraft(current => ({ ...current, pincode: value }))}
              placeholder={APP_TEXT.main.bookingFlow.pincodePlaceholder}
              keyboardType="number-pad"
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.latitudeLabel}
              isRequired
              value={addressDraft.latitude == null ? '' : String(addressDraft.latitude)}
              onChangeText={(value) => setAddressDraft(current => ({
                ...current,
                latitude: value.trim().length === 0 ? null : Number(value),
              }))}
              placeholder={APP_TEXT.main.bookingFlow.latitudePlaceholder}
              keyboardType="decimal-pad"
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.longitudeLabel}
              isRequired
              value={addressDraft.longitude == null ? '' : String(addressDraft.longitude)}
              onChangeText={(value) => setAddressDraft(current => ({
                ...current,
                longitude: value.trim().length === 0 ? null : Number(value),
              }))}
              placeholder={APP_TEXT.main.bookingFlow.longitudePlaceholder}
              keyboardType="decimal-pad"
            />
          </View>
        ) : null}
      </View>

      <View className="mt-5">
        <AppInput
          label={APP_TEXT.main.bookingFlow.notesSimpleLabel}
          value={notes}
          onChangeText={setNotes}
          placeholder={APP_TEXT.main.bookingFlow.notesPlaceholder}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ minHeight: 120 }}
        />
      </View>

      {hasMissingPriceSelection ? (
        <View className="mt-4 rounded-md px-4 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFF4EC' }}>
          <Text className="text-sm font-bold" style={{ color: '#C46A2B' }}>
            {APP_TEXT.main.bookingFlow.missingPriceSelectionError}
          </Text>
        </View>
      ) : null}

      {!hasValidSchedule ? (
        <View className="mt-4 rounded-md px-4 py-3" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFF4EC' }}>
          <Text className="text-sm font-bold" style={{ color: '#C46A2B' }}>
            {APP_TEXT.main.bookingFlow.invalidScheduleError}
          </Text>
        </View>
      ) : null}

      <View className="mt-6">
        <Button
          label={APP_TEXT.main.bookingFlow.reviewCta}
          disabled={!canReview}
          onPress={() => {
            if (!canReview) return;
            setBookingDetails({
              bookingType,
              scheduledDate,
              scheduledTime,
              address: addressDraft,
              notes: notes.trim(),
            });
            navigation.navigate(HOME_SCREEN.BOOKING_CONFIRMATION);
          }}
        />
      </View>
    </GradientScreen>
  );
}
