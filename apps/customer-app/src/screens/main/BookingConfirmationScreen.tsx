import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { BookingServiceSummaryCard } from '@/components/common/BookingServiceSummaryCard';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { BOOKING_SERVICE_SUMMARY_CARD_MODE } from '@/types/component-types';
import { CUSTOMER_BOOKING_TYPE, PRICE_TYPE } from '@/types/customer';
import type { BookingConfirmationScreenProps } from '@/types/main-screens';
import { HOME_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { apiPost } from '@/actions/http/httpClient';
import { palette, theme, uiColors } from '@/utils/theme';
import {
  buildAddressSummary,
  buildCreateBookingPayload,
  buildScheduledStartAt,
  createBookingIdempotencyKey,
  formatBookingScheduleLabel,
  formatCurrencyAmount,
  formatDurationChip,
  formatPriceOptionDescription,
  formatPriceOptionPricingLabel,
  getErrorMessage,
  getOptionalPriceOptions,
  getSelectedPriceOption,
  getServiceLineDisplayDurationMinutes,
  getServiceLineTotalAmount,
  hasValidCoordinates,
  normalizeCityName,
  returnToHomeAfterBookingCreate,
  shouldAllowQuantityControl,
  titleCase,
} from '@/utils';
import { getPriceRowTitle } from '@/utils/pricing.utils';

export function BookingConfirmationScreen({ navigation }: BookingConfirmationScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const { locationState } = useAuthContext();
  const {
    bookingDraft,
    subcategoryName,
    selectedServices,
    bookingType,
    scheduledDate,
    scheduledTime,
    address,
    notes,
    bookingQuote,
    setBookingQuote,
    fetchBookingQuote,
    removeService,
    resetFlow,
  } = useBookingFlowContext();
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const createAttemptIdempotencyKeyRef = useRef<string | null>(null);

  const selectedCity = useMemo(() => {
    return normalizeCityName(locationState.city || address.district);
  }, [address.district, locationState.city]);
  const canRequestQuote = selectedServices.length > 0 && hasValidCoordinates(address);
  const hasValidSubmitSchedule = bookingType === CUSTOMER_BOOKING_TYPE.INSTANT
    || Boolean(buildScheduledStartAt(scheduledDate, scheduledTime));
  const canSubmitBooking = Boolean(
    selectedCity
    && canRequestQuote
    && hasValidSubmitSchedule
    && !quoteLoading
    && !quoteError
    && bookingQuote
    && !confirming
  );
  const appliedOfferCode = bookingQuote?.couponCode ?? bookingQuote?.discountCodes?.find(Boolean) ?? null;

  const bookingOverview = useMemo(
    () => {
      const scheduleSummary = bookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED && scheduledDate && scheduledTime
        ? formatBookingScheduleLabel(scheduledDate, scheduledTime)
        : null;
      const trimmedNotes = notes.trim();
      const subcategoryLabel = subcategoryName ? titleCase(subcategoryName) : null;
      const fallbackServiceValue = selectedServices[0]?.service.name
        ? titleCase(selectedServices[0].service.name)
        : APP_TEXT.main.bookingFlow.summaryService;

      return {
        subtitle: subcategoryLabel ?? fallbackServiceValue,
        cards: [
          {
            key: 'subcategory',
            value: subcategoryLabel ?? fallbackServiceValue,
            iconName: 'layers-outline' as const,
            isWide: true,
          },
          {
            key: 'bookingType',
            value: bookingType === CUSTOMER_BOOKING_TYPE.INSTANT
              ? APP_TEXT.main.bookingFlow.instantSummaryLabel
              : APP_TEXT.main.bookingFlow.scheduledSummaryLabel,
            iconName: bookingType === CUSTOMER_BOOKING_TYPE.INSTANT ? 'flash-outline' as const : 'calendar-outline' as const,
            isWide: !scheduleSummary,
          },
          ...(scheduleSummary
            ? [{
              key: 'schedule',
              value: scheduleSummary,
              iconName: 'alarm-outline' as const,
              isWide: false,
            }]
            : []),
        ],
        rows: [
          {
            key: 'address',
            value: buildAddressSummary(address) || '-',
            iconName: 'location-outline' as const,
          },
          ...(trimmedNotes
            ? [{
              key: 'notes',
              value: trimmedNotes,
              iconName: 'document-text-outline' as const,
            }]
            : []),
        ],
      };
    },
    [address, bookingType, notes, scheduledDate, scheduledTime, selectedServices, subcategoryName],
  );
  const confirmTotalLabel = bookingQuote ? formatCurrencyAmount(bookingQuote.total) : null;
  const confirmButtonLabel = confirmTotalLabel
    ? `${APP_TEXT.main.bookingFlow.confirmCta} - ${confirmTotalLabel}`
    : APP_TEXT.main.bookingFlow.confirmCta;
  const selectedServiceCountLabel = selectedServices.length === 1
    ? APP_TEXT.main.bookingFlow.selectedServicesCountSingular
    : APP_TEXT.main.bookingFlow.selectedServicesCountSuffix;
  const selectedServicesItemLabel = `${selectedServices.length} ${selectedServices.length === 1 ? 'item' : 'items'}`;

  const refreshQuote = useCallback(async () => {
    if (!canRequestQuote) {
      setBookingQuote(null);
      setQuoteError(null);
      return;
    }

    setQuoteError(null);
    try {
      await fetchBookingQuote();
    } catch (error) {
      setQuoteError(getErrorMessage(error, APP_TEXT.main.bookingFlow.quoteError));
    }
  }, [canRequestQuote, fetchBookingQuote, setBookingQuote]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshQuote);

  const handleRemoveService = useCallback((serviceId: string) => {
    const willRemoveLastService = selectedServices.length <= 1
      && selectedServices.some(line => line.service.id === serviceId);
    removeService(serviceId);
    if (willRemoveLastService) {
      const nextSubcategoryId = bookingDraft.subcategoryId?.trim();
      if (nextSubcategoryId) {
        navigation.popToTop();
        navigation.navigate(HOME_SCREEN.SUBCATEGORY_SERVICES, {
          sourceType: bookingDraft.sourceType ?? 'category',
          categoryId: bookingDraft.categoryId ?? undefined,
          subcategoryId: nextSubcategoryId,
          city: selectedCity || undefined,
        });
        return;
      }
      navigation.goBack();
    }
  }, [bookingDraft.categoryId, bookingDraft.sourceType, bookingDraft.subcategoryId, navigation, removeService, selectedCity, selectedServices]);

  useEffect(() => {
    createAttemptIdempotencyKeyRef.current = null;
  }, [bookingDraft, selectedCity]);

  useEffect(() => {
    let active = true;

    const loadQuote = async () => {
      if (!canRequestQuote) {
        setBookingQuote(null);
        setQuoteError(null);
        setQuoteLoading(false);
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);
      try {
        await fetchBookingQuote();
      } catch (error) {
        if (active) {
          setQuoteError(getErrorMessage(error, APP_TEXT.main.bookingFlow.quoteError));
        }
      } finally {
        if (active) {
          setQuoteLoading(false);
        }
      }
    };

    void loadQuote();

    return () => {
      active = false;
    };
  }, [canRequestQuote, fetchBookingQuote, setBookingQuote]);

  const onConfirm = async () => {
    if (!canSubmitBooking) return;
    setConfirming(true);
    try {
      const idempotencyKey = createAttemptIdempotencyKeyRef.current ?? createBookingIdempotencyKey();
      createAttemptIdempotencyKeyRef.current = idempotencyKey;

      const payload = buildCreateBookingPayload({
        city: selectedCity,
        bookingDraft,
      });

      await apiPost<unknown, typeof payload>('/booking', payload, {
        auth: true,
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      createAttemptIdempotencyKeyRef.current = null;
      resetFlow();
      returnToHomeAfterBookingCreate(navigation);
    } catch {
      // The HTTP client shows the API error toast; keep the key for retrying this submit.
    } finally {
      setConfirming(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
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

      <View
        className="mt-1 overflow-hidden rounded-2xl border"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
          shadowColor: uiColors.shadow.base,
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
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
                    {APP_TEXT.main.bookingFlow.confirmTitle}
                  </Text>
                  <Text className="mt-0.5 text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {bookingOverview.subtitle}
                  </Text>
                </View>
              </View>
        </View>

        <View className="p-3">
          <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
            {bookingOverview.cards.map(row => (
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
            {bookingOverview.rows.map(row => (
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
                  style={{
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
                  }}
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

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-xs font-extrabold uppercase text-baseDark dark:text-white">
          {APP_TEXT.main.bookingFlow.selectedServicesTitle}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {selectedServicesItemLabel}
        </Text>
      </View>

      <View className="mt-3 gap-3">
        {selectedServices.map((line) => {
          const selectedOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
          const optionalPriceOptions = getOptionalPriceOptions(line.service.priceOptions);
          const displayDurationMinutes = getServiceLineDisplayDurationMinutes(line);
          const quotedServiceLine = bookingQuote?.serviceLines?.find(quoteLine =>
            quoteLine.serviceId === line.service.id
            && quoteLine.selectedPriceOptionId === line.selectedPriceOptionId,
          );
          
          const rawQuoteTotal = quotedServiceLine?.subtotal;
          const localLineTotal = getServiceLineTotalAmount(line.service, line.selectedPriceOptionId, line.quantity, line.selectedDurationMinutes);
          const resolvedLineTotal = rawQuoteTotal != null ? Number(rawQuoteTotal) : localLineTotal;
          const lineTotalLabel = resolvedLineTotal != null && !Number.isNaN(resolvedLineTotal)
            ? (formatCurrencyAmount(resolvedLineTotal) ?? '--')
            : '--';

          const selectedValueRow = selectedOption?.priceType === PRICE_TYPE.HOURLY
            ? (displayDurationMinutes
              ? {
                label: 'Duration',
                value: formatDurationChip(displayDurationMinutes),
              }
              : null)
            : (shouldAllowQuantityControl(selectedOption)
              ? {
                label: APP_TEXT.main.bookingFlow.quantityLabel,
                value: String(line.quantity),
              }
              : null);
          const pricingRow = selectedOption
            ? {
              label: getPriceRowTitle(selectedOption.priceType, selectedOption.priceComputationMode),
              value: typeof selectedOption.price === 'number' ? formatCurrencyAmount(selectedOption.price) : '--',
            }
            : null;

          return (
            <BookingServiceSummaryCard
              key={line.service.id}
              mode={BOOKING_SERVICE_SUMMARY_CARD_MODE.EDIT}
              title={titleCase(line.service.name)}
              iconText={line.service.iconText}
              selectedValueLabel={selectedValueRow?.label ?? APP_TEXT.main.bookingFlow.quantityLabel}
              selectedValue={selectedValueRow?.value ?? String(line.quantity)}
              pricingTitle={pricingRow?.label ?? 'Price'}
              pricingValue={pricingRow?.value ?? '--'}
              totalLabel={lineTotalLabel}
              addons={optionalPriceOptions.map((option, index) => {
                const normalizedId = option.id ?? `addon-${index}`;
                const normalizedTitle = option.title ?? 'Add-on';
                const normalizedDescription = formatPriceOptionDescription(option) || undefined;
                const normalizedPricingLabel = formatPriceOptionPricingLabel(option) || '--';

                return {
                  id: normalizedId,
                  title: normalizedTitle,
                  description: normalizedDescription,
                  pricingLabel: normalizedPricingLabel,
                };
              })}
              onRemove={() => handleRemoveService(line.service.id)}
            />
          );
        })}
      </View>

      {appliedOfferCode ? (
        <View
          className="mt-4 flex-row items-center rounded-2xl border px-4 py-3"
          style={{
            borderColor: theme.colors.primary,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
            borderStyle: 'dashed',
          }}
        >
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.onPrimary} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-sm font-extrabold text-baseDark dark:text-white" numberOfLines={1}>{appliedOfferCode}</Text>
              <Text className="mt-0.5 text-[10px]" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {APP_TEXT.main.bookingFlow.quoteCouponAppliedSubtitle}
              </Text>
            </View>
          </View>
          <View className="shrink-0 rounded-full px-2.5 py-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}>
            <Text className="text-xs font-extrabold" style={{ color: theme.colors.positive }}>
              {APP_TEXT.main.bookingFlow.quoteApplied}
            </Text>
          </View>
        </View>
      ) : null}

      <View
        className="mt-5 overflow-hidden rounded-2xl border"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        }}
      >
        <View className="flex-row items-center px-4 py-4" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft40 }}>
          <Ionicons name="sparkles-outline" size={21} color={theme.colors.primary} />
          <Text className="ml-2 text-base font-extrabold uppercase tracking-[2px] text-baseDark dark:text-white">
            {APP_TEXT.main.bookingFlow.billSummaryTitle}
          </Text>
        </View>

        <View className="p-4">
          {quoteLoading ? (
            <View className="items-center py-5">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="mt-3 text-sm font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {APP_TEXT.main.bookingFlow.quoteLoading}
              </Text>
            </View>
          ) : null}

          {!quoteLoading && quoteError ? (
            <View className="py-2">
              <Text className="text-sm font-semibold" style={{ color: theme.colors.negative }}>
                {quoteError}
              </Text>
              <View className="mt-3">
                <Button
                  label={APP_TEXT.main.bookingFlow.retry}
                  variant="secondary"
                  onPress={() => {
                    setQuoteLoading(true);
                    setQuoteError(null);
                    void refreshQuote()
                      .finally(() => setQuoteLoading(false));
                  }}
                />
              </View>
            </View>
          ) : null}

          {!quoteLoading && !quoteError && bookingQuote ? (
            <>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-baseDark dark:text-white">
                  {APP_TEXT.main.bookingFlow.quoteSubtotal} ({selectedServices.length} {selectedServiceCountLabel})
                </Text>
                <Text className="text-base font-extrabold text-baseDark dark:text-white">{formatCurrencyAmount(bookingQuote.subtotal)}</Text>
              </View>
              <View className="mt-4 flex-row items-start justify-between">
                <View>
                  <Text className="text-sm text-baseDark dark:text-white">{APP_TEXT.main.bookingFlow.quotePlatformFee}</Text>
                  <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {APP_TEXT.main.bookingFlow.quotePlatformFeeHint}
                  </Text>
                </View>
                <Text className="text-base font-extrabold text-baseDark dark:text-white">{formatCurrencyAmount(bookingQuote.platformFee)}</Text>
              </View>
              {bookingQuote.discountTotal > 0 ? (
                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="text-sm text-baseDark dark:text-white">
                    {APP_TEXT.main.bookingFlow.quoteDiscount}{appliedOfferCode ? ` (${appliedOfferCode})` : ''}
                  </Text>
                  <Text className="text-base font-extrabold" style={{ color: theme.colors.positive }}>
                    - {formatCurrencyAmount(bookingQuote.discountTotal)}
                  </Text>
                </View>
              ) : null}
              <View className="my-4 h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }} />
              <View className="flex-row items-center justify-between px-1 py-1">
                <Text className="text-sm font-bold text-baseDark dark:text-white">
                  {APP_TEXT.main.bookingFlow.quoteTotalPay}
                </Text>
                <Text className="text-2xl font-extrabold" style={{ color: theme.colors.caution }}>
                  {formatCurrencyAmount(bookingQuote.total)}
                </Text>
              </View>
              {bookingQuote.isEstimated ? (
                <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {APP_TEXT.main.bookingFlow.quoteEstimatedHint}
                </Text>
              ) : null}
              {bookingQuote.discountTotal > 0 ? (
                <View className="mt-2 flex-row justify-end">
                  <View
                    className="rounded-full border px-4 py-2"
                    style={{
                      borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                      backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
                    }}
                  >
                    <Text className="text-xs font-extrabold" style={{ color: theme.colors.positive }}>
                      {APP_TEXT.main.bookingFlow.quoteYouSavePrefix} {formatCurrencyAmount(bookingQuote.discountTotal)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </View>

      <View className="mt-4">
        <Button
          label={confirmButtonLabel}
          onPress={() => void onConfirm()}
          loading={confirming}
          disabled={!canSubmitBooking}
        />
      </View>
    </GradientScreen>
  );
}
