import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppInput } from '@/components/common/AppInput';
import { BackButton } from '@/components/common/BackButton';
import { BookingServiceDetailCard } from '@/components/common/BookingServiceDetailCard';
import { BookingTypeChip } from '@/components/common/BookingTypeChip';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useBookingDetailsScreenController } from '@/hooks/useBookingDetailsScreenController';
import { CUSTOMER_BOOKING_TYPE } from '@/types/customer';
import type { BookingDetailsScreenProps } from '@/types/main-screens';
import { HOME_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import {
  formatBookingTimeChipLabel,
  getServiceLineTotalAmount,
  getSelectedPriceOption,
  titleCase,
} from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingDetailsScreen({ navigation }: BookingDetailsScreenProps) {
  const {
    isDark,
    categoryName,
    selectedServices,
    bookingType,
    scheduledDate,
    scheduledTime,
    notes,
    addressDraft,
    selectedDurationByService,
    dateChoices,
    timeOptions,
    currentLocationSummary,
    currentLocationPrimaryLine,
    locationRefreshing,
    locationError,
    hasMissingPriceSelection,
    hasValidSchedule,
    canReview,
    setBookingType,
    setScheduledDate,
    setScheduledTime,
    setNotes,
    setAddressMode,
    setAddressField,
    refreshCurrentLocation,
    selectServicePriceOption,
    selectServiceDuration,
    decreaseServiceQuantity,
    increaseServiceQuantity,
    removeSelectedService,
    reviewBooking,
  } = useBookingDetailsScreenController({
    onNavigateToConfirmation: () => navigation.navigate(HOME_SCREEN.BOOKING_CONFIRMATION),
  });

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
          selected={bookingType === CUSTOMER_BOOKING_TYPE.INSTANT}
          onPress={() => setBookingType(CUSTOMER_BOOKING_TYPE.INSTANT)}
        />
        <BookingTypeChip
          label={APP_TEXT.main.bookingFlow.scheduledBookingLabel}
          selected={bookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED}
          onPress={() => setBookingType(CUSTOMER_BOOKING_TYPE.SCHEDULED)}
        />
      </View>

      {bookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED ? (
        <>
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-baseDark dark:text-white">Select date</Text>
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
                        {formatBookingTimeChipLabel(timeOption)}
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
            : null;

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
                selectServicePriceOption(line.service.id, priceOptionId);
              }}
              onSelectDurationMinutes={(minutes) => {
                selectServiceDuration(line.service, line.selectedPriceOptionId, minutes);
              }}
              onDecreaseQuantity={() => decreaseServiceQuantity(line.service.id, line.quantity)}
              onIncreaseQuantity={() => increaseServiceQuantity(line.service.id, line.quantity)}
              onRemoveService={() => removeSelectedService(line.service.id)}
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
            void refreshCurrentLocation();
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

        <Pressable onPress={() => setAddressMode('pin')}>
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
              onChangeText={(value) => setAddressField('addressLine1', value)}
              placeholder={APP_TEXT.main.bookingFlow.addressPlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.addressLine2Label}
              value={addressDraft.addressLine2}
              onChangeText={(value) => setAddressField('addressLine2', value)}
              placeholder={APP_TEXT.main.bookingFlow.addressLine2Placeholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.areaLabel}
              isRequired
              value={addressDraft.area}
              onChangeText={(value) => setAddressField('area', value)}
              placeholder={APP_TEXT.main.bookingFlow.areaPlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.districtLabel}
              isRequired
              value={addressDraft.district}
              onChangeText={(value) => setAddressField('district', value)}
              placeholder={APP_TEXT.main.bookingFlow.districtPlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.stateFieldLabel}
              isRequired
              value={addressDraft.state}
              onChangeText={(value) => setAddressField('state', value)}
              placeholder={APP_TEXT.main.bookingFlow.statePlaceholder}
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.pincodeLabel}
              isRequired
              value={addressDraft.pincode}
              onChangeText={(value) => setAddressField('pincode', value)}
              placeholder={APP_TEXT.main.bookingFlow.pincodePlaceholder}
              keyboardType="number-pad"
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.latitudeLabel}
              isRequired
              value={addressDraft.latitude == null ? '' : String(addressDraft.latitude)}
              onChangeText={(value) => setAddressField('latitude', value)}
              placeholder={APP_TEXT.main.bookingFlow.latitudePlaceholder}
              keyboardType="decimal-pad"
            />
            <AppInput
              label={APP_TEXT.main.bookingFlow.longitudeLabel}
              isRequired
              value={addressDraft.longitude == null ? '' : String(addressDraft.longitude)}
              onChangeText={(value) => setAddressField('longitude', value)}
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
          onPress={reviewBooking}
        />
      </View>
    </GradientScreen>
  );
}
