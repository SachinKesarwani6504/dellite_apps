import { useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
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
    Array.isArray(line.service.priceOptions)
      && line.service.priceOptions.length > 0
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

  const setAddressMode = (mode: BookingFlowAddressDraft['mode']) => {
    setAddressDraft(current => ({ ...current, mode }));
  };

  const setAddressField = (field: keyof BookingFlowAddressDraft, value: string) => {
    setAddressDraft(current => nextAddressDraft(current, field, value));
  };

  const refreshCurrentLocation = async () => {
    await refreshLocation();
    setAddressDraft({
      ...detectedAddressDraft,
      mode: 'google',
      addressLine2: addressDraft.addressLine2,
    });
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
