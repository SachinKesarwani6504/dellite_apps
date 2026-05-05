import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import type { BookingFlowAddressDraft } from '@/types/booking-flow-context';
import { CUSTOMER_BOOKING_TYPE } from '@/types/customer';
import type {
  BookingDetailsScreenControllerArgs,
  BookingDetailsScreenControllerValue,
} from '@/types/main-screens';
import { APP_TEXT } from '@/utils/appText';
import {
  buildAddressSummary,
  buildBookingTimeOptions,
  buildDetectedAddressDraft,
  buildLocationPrimaryLine,
  buildNextBookingDateChoices,
  buildScheduledStartAt,
  getRequiredPriceOptions,
  getSelectableDurations,
  getSelectedPriceOption,
  isBookingAddressComplete,
  shouldAllowDurationControl,
  shouldAllowQuantityControl,
} from '@/utils';

function toCoordinateValue(raw: string): number | null {
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function nextAddressDraft(
  current: BookingFlowAddressDraft,
  field: keyof BookingFlowAddressDraft,
  value: string,
): BookingFlowAddressDraft {
  if (field === 'latitude') {
    return { ...current, latitude: toCoordinateValue(value) };
  }
  if (field === 'longitude') {
    return { ...current, longitude: toCoordinateValue(value) };
  }
  return { ...current, [field]: value } as BookingFlowAddressDraft;
}

function logBookingLocationDebug(message: string, payload: unknown) {
  console.log(`[booking-location] ${message}`, payload);
}

export function useBookingDetailsScreenController(
  args: BookingDetailsScreenControllerArgs,
): BookingDetailsScreenControllerValue {
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
    setBookingAddress,
    setBookingDetails,
  } = useBookingFlowContext();
  const [bookingType, setBookingTypeState] = useState(contextBookingType);
  const [scheduledDate, setScheduledDateState] = useState(
    contextBookingType === CUSTOMER_BOOKING_TYPE.SCHEDULED ? contextScheduledDate : '',
  );
  const [scheduledTime, setScheduledTimeState] = useState(contextScheduledTime);
  const [addressDraft, setAddressDraft] = useState(contextAddress);
  const [notes, setNotes] = useState(contextNotes);
  const [selectedDurationByService, setSelectedDurationByService] = useState<Record<string, number>>({});

  const dateChoices = useMemo(buildNextBookingDateChoices, []);
  const timeOptions = useMemo(buildBookingTimeOptions, []);

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

  useFocusEffect(useCallback(() => {
    setAddressDraft(contextAddress);
  }, [contextAddress]));

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
      setScheduledDateState('');
      setScheduledTimeState('');
    }
  }, [dateChoices, scheduledDate]);

  useEffect(() => {
    selectedServices.forEach((line) => {
      if (line.selectedPriceOptionId) return;
      const [defaultOption] = getRequiredPriceOptions(line.service.priceOptions);
      if (defaultOption?.id) {
        setServicePriceOption(line.service.id, defaultOption.id);
      }
    });
  }, [selectedServices, setServicePriceOption]);

  useEffect(() => {
    selectedServices.forEach((line) => {
      const selectedPriceOption = getSelectedPriceOption(line.service, line.selectedPriceOptionId);
      if (shouldAllowQuantityControl(selectedPriceOption) && line.quantity < 1) {
        setServiceQuantity(line.service.id, 1);
      }
      if (!shouldAllowDurationControl(selectedPriceOption)) {
        return;
      }
      const allowedDurations = getSelectableDurations(selectedPriceOption);
      if (allowedDurations.length === 0) {
        return;
      }
      const existingSelection = selectedDurationByService[line.service.id];
      const defaultDuration = typeof existingSelection === 'number' ? existingSelection : allowedDurations[0];
      if (existingSelection !== defaultDuration) {
        setSelectedDurationByService(prev => ({ ...prev, [line.service.id]: defaultDuration }));
      }
      const billingUnit = selectedPriceOption?.billingUnitMinutes && selectedPriceOption.billingUnitMinutes > 0
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
    getRequiredPriceOptions(line.service.priceOptions).length > 0
      && !line.selectedPriceOptionId,
  );

  const hasValidSchedule = bookingType === CUSTOMER_BOOKING_TYPE.INSTANT
    || Boolean(buildScheduledStartAt(scheduledDate, scheduledTime));
  const canReview = selectedServices.length > 0
    && !hasMissingPriceSelection
    && isBookingAddressComplete(addressDraft)
    && hasValidSchedule;

  const currentLocationSummary = buildAddressSummary(detectedAddressDraft) || APP_TEXT.main.bookingFlow.currentLocationEmptyHint;
  const currentLocationPrimaryLine = buildLocationPrimaryLine(detectedAddressDraft) || resolvedLocation.displayCity || 'Location not ready';
  const pinnedLocationSummary = buildAddressSummary(addressDraft) || APP_TEXT.main.bookingFlow.pinLocationEmptyHint;
  const pinnedLocationPrimaryLine = buildLocationPrimaryLine(addressDraft) || APP_TEXT.main.bookingFlow.pinLocationFallbackTitle;

  const setBookingType = (next: typeof contextBookingType) => {
    setBookingTypeState(next);
    if (next === CUSTOMER_BOOKING_TYPE.INSTANT) {
      setScheduledDateState('');
      setScheduledTimeState('');
    }
  };

  const setScheduledDate = (next: string) => {
    setScheduledDateState(next);
    if (next && !scheduledTime) {
      setScheduledTimeState('06:00');
    }
  };

  const setScheduledTime = (next: string) => {
    setScheduledTimeState(next);
  };

  const refreshCurrentLocation = async () => {
    const nextLocation = await refreshLocation();
    const nextAddressDraft = nextLocation ? buildDetectedAddressDraft(nextLocation) : detectedAddressDraft;
    logBookingLocationDebug('current-location:resolved', {
      sourceLocation: nextLocation ?? {
        city,
        locality,
        state,
        country,
        postalCode,
        formattedAddress,
        latitude,
        longitude,
      },
      storedAddressDraft: {
        ...nextAddressDraft,
        mode: 'google',
      },
    });
    const nextDraft = {
      ...nextAddressDraft,
      mode: 'google',
      addressLine2: addressDraft.addressLine2,
    } satisfies BookingFlowAddressDraft;
    setAddressDraft(nextDraft);
    setBookingAddress(nextDraft);
  };

  const setAddressMode = (mode: BookingFlowAddressDraft['mode']) => {
    if (mode === 'google') {
      void refreshCurrentLocation();
      return;
    }

    const sourceDraft = isBookingAddressComplete(addressDraft) ? addressDraft : detectedAddressDraft;
    const nextDraft = { ...sourceDraft, mode };
    setAddressDraft(nextDraft);
    setBookingAddress(nextDraft);
  };

  const setAddressField = (field: keyof BookingFlowAddressDraft, value: string) => {
    setAddressDraft(current => nextAddressDraft(current, field, value));
  };

  const selectServicePriceOption = (serviceId: string, priceOptionId: string) => {
    setServicePriceOption(serviceId, priceOptionId);
  };

  const selectServiceDuration = (
    service: BookingDetailsScreenControllerValue['selectedServices'][number]['service'],
    selectedPriceOptionId: string | null,
    minutes: number,
  ) => {
    setSelectedDurationByService(prev => ({ ...prev, [service.id]: minutes }));
    const priceOption = service.priceOptions?.find(option => option.id === selectedPriceOptionId);
    if (!shouldAllowDurationControl(priceOption ?? null)) return;
    const billingUnit = priceOption?.billingUnitMinutes && priceOption.billingUnitMinutes > 0
      ? priceOption.billingUnitMinutes
      : 30;
    if (!billingUnit) return;
    const nextQuantity = Math.max(1, Math.ceil(minutes / billingUnit));
    setServiceQuantity(service.id, nextQuantity);
  };

  const decreaseServiceQuantity = (serviceId: string, quantity: number) => {
    setServiceQuantity(serviceId, quantity - 1);
  };

  const increaseServiceQuantity = (serviceId: string, quantity: number) => {
    setServiceQuantity(serviceId, quantity + 1);
  };

  const removeSelectedService = (serviceId: string) => {
    removeService(serviceId);
  };

  const reviewBooking = () => {
    if (!canReview) return;
    setBookingDetails({
      bookingType,
      scheduledDate,
      scheduledTime,
      address: addressDraft,
      notes: notes.trim(),
    });
    args.onNavigateToConfirmation();
  };

  return {
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
    setAddressField,
    refreshCurrentLocation,
    selectServicePriceOption,
    selectServiceDuration,
    decreaseServiceQuantity,
    increaseServiceQuantity,
    removeSelectedService,
    reviewBooking,
  };
}
