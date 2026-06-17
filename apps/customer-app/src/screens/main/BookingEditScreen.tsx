import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import { AppInput } from '@/components/common/AppInput';
import { BookingServiceDetailCard } from '@/components/common/BookingServiceDetailCard';
import { Button } from '@/components/common/Button';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { useBookingEditController } from '@/hooks/useBookingEditController';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { BookingEditScreenProps } from '@/types/main-screens';
import { APP_TEXT } from '@/utils/appText';
import {
  getBookingLineKey,
  getBookingLineDurationMinutes,
} from '@/utils/booking-details';
import {
  buildFallbackEditableService,
  getEditableDurationMinutes,
  getEditableSelectedPriceOption,
} from '@/utils/booking-edit';
import { getServiceLineTotalAmount } from '@/utils/booking-flow';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingEditScreen({ navigation, route }: BookingEditScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const {
    details,
    isEditable,
    serviceByLineKey,
    loading,
    saving,
    error,
    notes,
    canSave,
    setNotes,
    getLineDraft,
    increaseQuantity,
    selectLineDuration,
    selectLinePriceOption,
    saveChanges,
    refresh,
  } = useBookingEditController(route.params.bookingId);
  const { refreshing, onRefresh } = usePullToRefresh(refresh);
  const cardStyle = {
    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
    backgroundColor: isDark ? palette.dark.card : palette.light.card,
  };
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  return (
    <GradientScreen
      keyboardAware
      keyboardExtraScrollHeight={200}
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

      <Text className="mt-2 text-3xl font-extrabold text-baseDark dark:text-white">
        {APP_TEXT.main.bookings.editTitle}
      </Text>
      <Text className="mt-2 text-sm leading-5" style={{ color: mutedTextColor }}>
        {APP_TEXT.main.bookings.editSubtitle}
      </Text>

      {loading ? (
        <LoadingState minHeight={320} />
      ) : null}

      {!loading && error && !details ? (
        <ListEmptyState
          containerClassName="mt-4"
          title={APP_TEXT.main.bookings.editLoadError}
          description={error}
          icon="alert-circle-outline"
          actionLabel={APP_TEXT.network.retryButton}
          onAction={() => {
            void refresh();
          }}
        />
      ) : null}

      {!loading && details && !isEditable ? (
        <ListEmptyState
          containerClassName="mt-4"
          title={APP_TEXT.main.bookings.editUnavailableTitle}
          description={APP_TEXT.main.bookings.editUnavailableDescription}
          icon="alert-circle-outline"
          actionLabel={APP_TEXT.network.retryButton}
          onAction={() => {
            void refresh();
          }}
        />
      ) : null}

      {details && isEditable ? (
        <>
          <View className="mt-4 gap-3">
            {(details.serviceLines ?? []).map((line, index) => {
              const draft = getLineDraft(line);
              const lineKey = getBookingLineKey(line);
              const service = serviceByLineKey[lineKey] ?? buildFallbackEditableService(line);
              const selectedPriceOption = getEditableSelectedPriceOption(service, line, draft);
              const selectedDurationMinutes = getEditableDurationMinutes(selectedPriceOption, draft);
              const lineIsEditable = Boolean(line.id);
              const lineTotalAmount = getServiceLineTotalAmount(
                service,
                draft.selectedPriceOptionId,
                draft.quantity,
                selectedDurationMinutes,
              );
              return (
                <BookingServiceDetailCard
                  key={line.id ?? `${lineKey}-${index}`}
                  service={service}
                  selectedPriceOption={selectedPriceOption}
                  selectedPriceOptionId={draft.selectedPriceOptionId}
                  quantity={draft.quantity}
                  unitPriceAmount={selectedPriceOption?.price ?? null}
                  lineTotalAmount={lineTotalAmount}
                  isDark={isDark}
                  selectedDurationMinutes={selectedDurationMinutes}
                  hideRemoveAction
                  hideDecreaseQuantityAction
                  hideFlexiblePriceOptionChoices
                  readOnly={!lineIsEditable}
                  readOnlyReason={!lineIsEditable ? APP_TEXT.main.bookings.editLineReadOnlyReason : null}
                  minSelectableDurationMinutes={getBookingLineDurationMinutes(line)}
                  onSelectPriceOption={(priceOptionId) => {
                    if (!lineIsEditable) return;
                    selectLinePriceOption(line, priceOptionId);
                  }}
                  onSelectDurationMinutes={(minutes) => {
                    if (!lineIsEditable) return;
                    selectLineDuration(line, minutes);
                  }}
                  onDecreaseQuantity={() => undefined}
                  onIncreaseQuantity={() => {
                    if (!lineIsEditable) return;
                    increaseQuantity(line);
                  }}
                  onRemoveService={() => undefined}
                />
              );
            })}
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

          {error ? (
            <Text className="mt-4 text-sm font-semibold" style={{ color: theme.colors.negative }}>
              {error}
            </Text>
          ) : null}

          <View className="mt-5">
            <Button
              label={APP_TEXT.main.bookings.editSaveButton}
              loading={saving}
              disabled={!canSave || saving}
              onPress={() => {
                void saveChanges().then((saved) => {
                  if (saved) navigation.goBack();
                });
              }}
            />
          </View>
        </>
      ) : null}
    </GradientScreen>
  );
}
