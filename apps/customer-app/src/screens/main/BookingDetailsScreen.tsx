import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppInput } from '@/components/common/AppInput';
import { BackButton } from '@/components/common/BackButton';
import { BookingServiceDetailCard } from '@/components/common/BookingServiceDetailCard';
import { Button } from '@/components/common/Button';
import { CardWrapper } from '@/components/common/CardWrapper';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { TwoOptionPillTabs } from '@/components/common/TwoOptionPillTabs';
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
    pinnedLocationSummary,
    pinnedLocationPrimaryLine,
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
    <GradientScreen
      keyboardExtraScrollHeight={200}
    >
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <SplitGradientTitle
        eyebrow={APP_TEXT.main.bookingFlow.detailsEyebrow}
        prefix="Book your"
        highlight={categoryName ? titleCase(categoryName) : ''}
        wrapHighlight
      />

      <View className="mt-5">
        <TwoOptionPillTabs
          isDark={isDark}
          value={bookingType}
          onChange={setBookingType}
          items={[
            {
              label: APP_TEXT.main.bookingFlow.instantBookingLabel,
              value: CUSTOMER_BOOKING_TYPE.INSTANT,
              iconName: 'flash-outline',
            },
            {
              label: APP_TEXT.main.bookingFlow.scheduledBookingLabel,
              value: CUSTOMER_BOOKING_TYPE.SCHEDULED,
              iconName: 'calendar-outline',
            },
          ]}
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
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 10, gap: 10 }}
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
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
                  }}
                >
                  <Text className={`text-[10px] font-bold uppercase ${selected ? 'text-primary dark:text-accent' : 'text-textPrimary/70 dark:text-white/70'}`}>{choice.topLabel}</Text>
                  <Text className={`mt-1 text-2xl font-extrabold ${selected ? 'text-primary dark:text-accent' : 'text-baseDark dark:text-white'}`}>{choice.dayOfMonth}</Text>
                  <Text className={`text-xs font-semibold ${selected ? 'text-primary dark:text-accent' : 'text-textPrimary/70 dark:text-white/70'}`}>{choice.monthLabel}</Text>
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
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 10, gap: 10 }}
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
                        shadowColor: selected ? uiColors.shadow.base : 'transparent',
                        shadowOpacity: selected ? 0.22 : 0,
                        shadowRadius: selected ? 10 : 0,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: selected ? 4 : 0,
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
          const lineTotalAmount = getServiceLineTotalAmount(line.service, line.selectedPriceOptionId, line.quantity, line.selectedDurationMinutes);
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
      <CardWrapper isDark={isDark} className="mt-3 rounded-lg border p-4" lightBackgroundColor={palette.light.card}>
        <TwoOptionPillTabs
          isDark={isDark}
          value={addressDraft.mode}
          onChange={(nextMode) => {
            if (nextMode === 'google') {
              setAddressMode(nextMode);
              return;
            }

            setAddressMode(nextMode);
            navigation.navigate(HOME_SCREEN.BOOKING_LOCATION_PICKER);
          }}
          items={[
            {
              label: APP_TEXT.main.bookingFlow.locationCurrentTitle,
              value: 'google',
              iconName: 'locate-outline',
            },
            {
              label: APP_TEXT.main.bookingFlow.locationManualTitle,
              value: 'pin',
              iconName: 'location-outline',
            },
          ]}
        />

        {addressDraft.mode === 'google' ? (
          <View className="mt-3">
            <View
              className="rounded-md border px-3 py-3"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="mr-3 flex-1">
                  <Text className="text-sm font-bold text-baseDark dark:text-white">{titleCase(currentLocationPrimaryLine)}</Text>
                </View>
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
            <Pressable
              onPress={() => {
                void refreshCurrentLocation();
              }}
              className="mt-3 items-center rounded-full px-4 py-3"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Text className="text-xs font-extrabold text-white">
                {locationRefreshing ? APP_TEXT.main.bookingFlow.refreshingLocationLabel : APP_TEXT.main.bookingFlow.useCurrentLocationCta}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {addressDraft.mode === 'pin' ? (
          <View className="mt-3">
            <View
              className="rounded-md border px-3 py-3"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
              }}
            >
              <Text className="text-sm font-bold text-baseDark dark:text-white">{titleCase(pinnedLocationPrimaryLine)}</Text>
              <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {pinnedLocationSummary}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate(HOME_SCREEN.BOOKING_LOCATION_PICKER)}
              className="mt-3 items-center rounded-full px-4 py-3"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Text className="text-xs font-extrabold text-white">
                {APP_TEXT.main.bookingFlow.changeLocationCta}
              </Text>
            </Pressable>
          </View>
        ) : null}

      </CardWrapper>

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
