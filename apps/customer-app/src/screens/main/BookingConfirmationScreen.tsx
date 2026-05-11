import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { CUSTOMER_BOOKING_TYPE, PRICE_TYPE } from '@/types/customer';
import type { BookingConfirmationScreenProps } from '@/types/main-screens';
import { MAIN_TAB_SCREEN } from '@/types/screen-names';
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
  shouldAllowQuantityControl,
  titleCase,
} from '@/utils';
import { getPriceRowTitle } from '@/utils/pricing.utils';

export function BookingConfirmationScreen({ navigation }: BookingConfirmationScreenProps) {
  const isDark = useColorScheme() === 'dark';
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
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
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
    && !bookingCode,
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
  const refreshControlProps = useBrandRefreshControl(refreshQuote);

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

      const response = await apiPost<{ data: { booking: { id: string; bookingCode: string; bookingStatus: string } } }>('/booking', payload, {
        auth: true,
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      setBookingCode(response.data?.booking?.bookingCode ?? null);
      setBookingId(response.data?.booking?.id ?? null);
      setBookingStatus(response.data?.booking?.bookingStatus ?? null);
      createAttemptIdempotencyKeyRef.current = null;
    } catch {
      // The HTTP client shows the API error toast; keep the key for retrying this submit.
    } finally {
      setConfirming(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
      refreshControl={<RefreshControl {...refreshControlProps} refreshing={refreshControlProps.refreshing || quoteLoading} />}
    >
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} visible={!bookingCode} />
      </View>

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
              <Text className="text-lg font-extrabold leading-6 text-baseDark dark:text-white">
                {APP_TEXT.main.bookingFlow.confirmTitle}
              </Text>
              <Text className="mt-0.5 text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {bookingOverview.subtitle}
              </Text>
            </View>
          </View>
          {confirmTotalLabel ? (
            <View
              className="rounded-full border px-3.5 py-2"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
              }}
            >
              <Text className="text-base font-extrabold text-baseDark dark:text-white">{confirmTotalLabel}</Text>
            </View>
          ) : null}
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
          
          const rawQuoteTotal = quotedServiceLine?.lineTotalAmount ?? quotedServiceLine?.subtotal;
          const localLineTotal = getServiceLineTotalAmount(line.service, line.selectedPriceOptionId, line.quantity, line.selectedDurationMinutes);
          const resolvedLineTotal = rawQuoteTotal != null ? Number(rawQuoteTotal) : localLineTotal;
          const lineTotalLabel = resolvedLineTotal != null && !Number.isNaN(resolvedLineTotal) ? formatCurrencyAmount(resolvedLineTotal) : '--';

          const selectedValueRow = selectedOption?.priceType === PRICE_TYPE.HOURLY
            ? (displayDurationMinutes
              ? {
                label: 'Duration',
                value: formatDurationChip(displayDurationMinutes),
                iconName: 'time-outline' as const,
              }
              : null)
            : (shouldAllowQuantityControl(selectedOption)
              ? {
                label: APP_TEXT.main.bookingFlow.quantityLabel,
                value: String(line.quantity),
                iconName: 'layers-outline' as const,
              }
              : null);
          const pricingRow = selectedOption
            ? {
              label: getPriceRowTitle(selectedOption.priceType, selectedOption.priceComputationMode),
              value: typeof selectedOption.price === 'number' ? formatCurrencyAmount(selectedOption.price) : '--',
              iconName: 'pricetag-outline' as const,
            }
            : null;

          return (
            <View
              key={line.service.id}
              className="rounded-2xl border px-3.5 py-3.5"
              style={{
                borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
                shadowColor: uiColors.shadow.base,
                shadowOpacity: isDark ? 0 : 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="mr-3 flex-1 flex-row items-center">
                  <View
                    className="mr-3 h-11 w-11 items-center justify-center rounded-xl border"
                    style={{
                      backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFF7EF',
                      borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                    }}
                  >
                    {line.service.iconText?.trim() ? (
                      <Text className="text-xl">{line.service.iconText.trim()}</Text>
                    ) : (
                      <Ionicons name="sparkles-outline" size={16} color={theme.colors.primary} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-extrabold leading-6 text-baseDark dark:text-white">{titleCase(line.service.name)}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => removeService(line.service.id)}
                  className="h-8 w-8 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFF8F2',
                    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  }}
                >
                  <Ionicons name="close" size={15} color={theme.colors.primary} />
                </Pressable>
              </View>

              {selectedValueRow || pricingRow ? (
                <View
                  className="mt-3 overflow-hidden rounded-xl border"
                  style={{
                    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                    backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
                  }}
                >
                  {selectedValueRow ? (
                    <View
                      className="flex-row items-center justify-between px-3 py-2.5"
                    >
                      <View className="mr-3 flex-row items-center">
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFFFFF' }}
                        >
                          <Ionicons name={selectedValueRow.iconName} size={14} color={theme.colors.primary} />
                        </View>
                        <Text className="ml-2 text-[11px] font-extrabold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                          {selectedValueRow.label}
                        </Text>
                      </View>
                      <Text className="text-sm font-extrabold text-baseDark dark:text-white">{selectedValueRow.value}</Text>
                    </View>
                  ) : null}

                  {pricingRow ? (
                    <View
                      className={`${selectedValueRow ? 'border-t' : ''} flex-row items-center justify-between px-3 py-2.5`}
                      style={selectedValueRow ? { borderTopColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight } : undefined}
                    >
                      <View className="mr-3 flex-row items-center">
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : '#FFFFFF' }}
                        >
                          <Ionicons name={pricingRow.iconName} size={14} color={theme.colors.primary} />
                        </View>
                        <Text className="ml-2 text-[11px] font-extrabold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                          {pricingRow.label}
                        </Text>
                      </View>
                      <Text className="max-w-[52%] text-right text-sm font-extrabold text-baseDark dark:text-white">{pricingRow.value}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {optionalPriceOptions.length > 0 ? (
                <View
                  className="mt-3 rounded-xl border px-3 py-3"
                  style={{
                    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                    backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
                  }}
                >
                  <Text className="text-xs font-extrabold text-baseDark dark:text-white">
                    {APP_TEXT.main.bookingFlow.possibleAddOnsTitle}
                  </Text>
                  <View className="mt-2 gap-2">
                    {optionalPriceOptions.map(option => (
                      <View key={option.id} className="flex-row items-start justify-between">
                        <View className="mr-3 flex-1">
                          <Text className="text-xs font-bold text-baseDark dark:text-white">{option.title}</Text>
                          {formatPriceOptionDescription(option) ? (
                            <Text className="mt-0.5 text-[11px]" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                              {formatPriceOptionDescription(option)}
                            </Text>
                          ) : null}
                        </View>
                        <Text className="text-xs font-extrabold text-primary">{formatPriceOptionPricingLabel(option)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              <View
                className="mt-3 flex-row items-center justify-between rounded-xl px-3 py-3"
                style={{
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
                }}
              >
                <Text className="text-xs font-extrabold uppercase text-baseDark dark:text-white">
                  {APP_TEXT.main.bookingFlow.subtotalLabel}
                </Text>
                <Text className="text-2xl font-extrabold text-baseDark dark:text-white">{lineTotalLabel}</Text>
              </View>
            </View>
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
              <View className="flex-row items-end justify-between">
                <View>
                  <Text className="text-xs font-extrabold uppercase" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {APP_TEXT.main.bookingFlow.quoteTotalPay}
                  </Text>
                  <Text className="mt-1 text-4xl font-extrabold" style={{ color: theme.colors.primary }}>
                    {formatCurrencyAmount(bookingQuote.total)}
                  </Text>
                  {bookingQuote.isEstimated ? (
                    <Text className="mt-2 max-w-[220px] text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                      {APP_TEXT.main.bookingFlow.quoteEstimatedHint}
                    </Text>
                  ) : null}
                </View>
                {bookingQuote.discountTotal > 0 ? (
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
                ) : null}
              </View>
            </>
          ) : null}
        </View>
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

      <View className="mt-4">
        {!bookingCode ? (
          <Button
            label={confirmButtonLabel}
            onPress={() => void onConfirm()}
            loading={confirming}
            disabled={!canSubmitBooking}
          />
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
