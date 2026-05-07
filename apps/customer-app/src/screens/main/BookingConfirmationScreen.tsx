import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { CUSTOMER_BOOKING_TYPE, PRICE_TYPE } from '@/types/customer';
import type { BookingConfirmationScreenProps } from '@/types/main-screens';
import { MAIN_TAB_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';
import {
  buildAddressSummary,
  formatCurrencyAmount,
  formatDurationChip,
  formatPriceOptionDescription,
  formatPriceOptionPricingLabel,
  getErrorMessage,
  getOptionalPriceOptions,
  getSelectedPriceOption,
  getServiceLineDisplayDurationMinutes,
  getServiceLineTotalAmount,
  shouldAllowQuantityControl,
  titleCase,
} from '@/utils';

export function BookingConfirmationScreen({ navigation }: BookingConfirmationScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { locationState } = useAuthContext();
  const {
    subcategoryName,
    selectedServices,
    bookingType,
    scheduledDate,
    scheduledTime,
    address,
    notes,
    bookingQuote,
    fetchBookingQuote,
    createBooking,
    removeService,
    resetFlow,
  } = useBookingFlowContext();
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const selectedCity = useMemo(() => {
    return locationState.city?.trim() || address.district.trim();
  }, [address.district, locationState.city]);

  const bookingOverview = useMemo(
    () => {
      const scheduleSummary = bookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED && scheduledDate && scheduledTime
        ? `${scheduledDate} at ${scheduledTime}`
        : null;
      const trimmedNotes = notes.trim();
      const subcategoryLabel = subcategoryName ? titleCase(subcategoryName) : null;
      const serviceValue = selectedServices.length === 1
        ? titleCase(selectedServices[0]?.service.name ?? APP_TEXT.main.bookingFlow.summaryService)
        : `${selectedServices.length} ${APP_TEXT.main.bookingFlow.selectedServicesCountSuffix}`;

      return {
        service: {
          value: serviceValue,
          helper: subcategoryLabel,
        },
        chips: [
          {
            key: 'bookingType',
            label: APP_TEXT.main.bookingFlow.summaryBookingType,
            value: bookingType === CUSTOMER_BOOKING_TYPE.INSTANT
              ? APP_TEXT.main.bookingFlow.instantSummaryLabel
              : APP_TEXT.main.bookingFlow.scheduledSummaryLabel,
            iconName: bookingType === CUSTOMER_BOOKING_TYPE.INSTANT ? 'flash-outline' as const : 'calendar-outline' as const,
          },
          ...(scheduleSummary
            ? [{
              key: 'schedule',
              label: APP_TEXT.main.bookingFlow.summarySlot,
              value: scheduleSummary,
              iconName: 'alarm-outline' as const,
            }]
            : []),
        ],
        rows: [
          {
            key: 'address',
            label: APP_TEXT.main.bookingFlow.summaryAddress,
            value: buildAddressSummary(address) || '-',
            iconName: 'location-outline' as const,
          },
          ...(trimmedNotes
            ? [{
              key: 'notes',
              label: APP_TEXT.main.bookingFlow.summaryNotes,
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

  useEffect(() => {
    let active = true;

    const loadQuote = async () => {
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
  }, [fetchBookingQuote]);

  const onConfirm = async () => {
    if (confirming || bookingCode || !selectedCity || quoteLoading || !bookingQuote) return;
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
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
    >
      <View className="mb-2 flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} visible={!bookingCode} />
      </View>

      <View
        className="mt-1 rounded-2xl border p-4"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
          shadowColor: uiColors.shadow.base,
          shadowOpacity: isDark ? 0 : 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="h-11 w-11 items-center justify-center rounded-full border"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
              }}
            >
              <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-extrabold leading-6 text-baseDark dark:text-white">
                {APP_TEXT.main.bookingFlow.confirmTitle}
              </Text>
              <Text className="mt-0.5 text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {selectedServices.length} {selectedServiceCountLabel}
              </Text>
            </View>
          </View>
          {confirmTotalLabel ? (
            <View
              className="rounded-full border px-3 py-1.5"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
              }}
            >
              <Text className="text-sm font-extrabold text-baseDark dark:text-white">{confirmTotalLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        className="mt-3 rounded-2xl border p-3"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
              }}
            >
              <Ionicons name="list-outline" size={15} color={theme.colors.primary} />
            </View>
            <Text className="ml-2 text-sm font-extrabold text-baseDark dark:text-white">
              {APP_TEXT.main.bookingFlow.bookingOverviewTitle}
            </Text>
          </View>
          <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {selectedServices.length} {selectedServiceCountLabel}
          </Text>
        </View>

        <View
          className="rounded-xl border p-3"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
          }}
        >
          <View className="flex-row items-center">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl border"
              style={{
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
              }}
            >
              <Ionicons name="briefcase-outline" size={18} color={theme.colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[11px] font-bold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {APP_TEXT.main.bookingFlow.summaryService}
              </Text>
              <Text className="mt-0.5 text-sm font-extrabold leading-5 text-baseDark dark:text-white">
                {bookingOverview.service.value}
              </Text>
              {bookingOverview.service.helper ? (
                <Text className="mt-0.5 text-xs font-semibold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {bookingOverview.service.helper}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className="mt-2 flex-row flex-wrap justify-between" style={{ gap: 8 }}>
          {bookingOverview.chips.map(row => (
            <View
              key={row.key}
              className="flex-row items-center border px-3 py-2.5"
              style={{
                width: bookingOverview.chips.length === 1 ? '100%' : '48.5%',
                borderRadius: 12,
                borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
              }}
            >
              <Ionicons name={row.iconName} size={15} color={theme.colors.primary} />
              <View className="ml-2 flex-1">
                <Text className="text-[10px] font-bold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {row.label}
                </Text>
                <Text className="mt-0.5 text-xs font-extrabold text-baseDark dark:text-white">{row.value}</Text>
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
                className="h-8 w-8 items-center justify-center rounded-full border"
                style={{
                  borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
                }}
              >
                <Ionicons name={row.iconName} size={14} color={theme.colors.primary} />
              </View>
              <View className="ml-2 flex-1">
                <Text className="text-[10px] font-bold" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {row.label}
                </Text>
                <Text className="mt-0.5 text-xs font-bold leading-4 text-baseDark dark:text-white">{row.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-xs font-extrabold uppercase text-baseDark dark:text-white">
          {APP_TEXT.main.bookingFlow.selectedServicesTitle}
        </Text>
        <View className="min-w-[26px] items-center rounded-full px-2 py-1" style={{ backgroundColor: theme.colors.baseDark }}>
          <Text className="text-[10px] font-extrabold text-white">{selectedServices.length}</Text>
        </View>
      </View>

      <View className="mt-3 gap-3">
        {selectedServices.map((line) => {
          const selectedOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
          const optionalPriceOptions = getOptionalPriceOptions(line.service.priceOptions);
          const displayDurationMinutes = getServiceLineDisplayDurationMinutes(line);
          const lineTotalAmount = getServiceLineTotalAmount(
            line.service,
            line.selectedPriceOptionId,
            line.quantity,
            line.selectedDurationMinutes,
          );
          const lineTotalLabel = formatCurrencyAmount(lineTotalAmount) ?? '--';
          const selectedValueRow = selectedOption?.priceType === PRICE_TYPE.HOURLY
            ? (displayDurationMinutes
              ? {
                label: APP_TEXT.main.bookingFlow.durationLabel,
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
              label: APP_TEXT.main.bookingFlow.priceOptionsTitle,
              value: formatPriceOptionPricingLabel(selectedOption),
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
                    className="mr-3 h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
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
                    <Text className="text-[15px] font-extrabold leading-5 text-baseDark dark:text-white">{titleCase(line.service.name)}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => removeService(line.service.id)}
                  className="h-7 w-7 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
                    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  }}
                >
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
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
                        <Text className="ml-2 text-[11px] font-extrabold uppercase" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
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
                        <Text className="ml-2 text-[11px] font-extrabold uppercase" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
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

      {bookingQuote?.couponCode ? (
        <View
          className="mt-4 flex-row items-center justify-between rounded-2xl border px-4 py-3"
          style={{
            borderColor: theme.colors.primary,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card,
            borderStyle: 'dashed',
          }}
        >
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.primary }}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.onPrimary} />
            </View>
            <View className="ml-3">
              <Text className="text-sm font-extrabold text-baseDark dark:text-white">{bookingQuote.couponCode}</Text>
              <Text className="mt-0.5 text-[10px]" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {APP_TEXT.main.bookingFlow.quoteCouponAppliedSubtitle}
              </Text>
            </View>
          </View>
          <View className="px-2 py-1">
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
                    void fetchBookingQuote()
                      .catch((error) => {
                        setQuoteError(getErrorMessage(error, APP_TEXT.main.bookingFlow.quoteError));
                      })
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
                    {APP_TEXT.main.bookingFlow.quoteDiscount}{bookingQuote.couponCode ? ` (${bookingQuote.couponCode})` : ''}
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
            disabled={quoteLoading || Boolean(quoteError) || !bookingQuote}
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
