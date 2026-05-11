import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { customerActions } from '@/actions';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { resolveProductLocation } from '@/modules/location-intelligence';
import type { BookingFlowAddressDraft } from '@/types/booking-flow-context';
import { CUSTOMER_BOOKING_TYPE } from '@/types/customer';
import type { CustomerHomeCategory } from '@/types/customer';
import type {
  CategoryCatalogUsageTypes,
  BookingDraftDetailsScreenControllerArgs,
  BookingDraftDetailsScreenControllerValue,
} from '@/types/main-screens';
import { APP_TEXT } from '@/utils/appText';
import {
  buildAddressSummary,
  buildBookingTimeOptions,
  buildDetectedAddressDraft,
  buildLocationPrimaryLine,
  buildNextBookingDateChoices,
  buildScheduledStartAt,
  getDefaultBookingDateValue,
  getErrorMessage,
  getNextBookingTimeValue,
  getRequiredPriceOptions,
  getSelectableDurations,
  getSelectedPriceOption,
  isBookingTimeOptionAvailable,
  isBookingAddressComplete,
  refreshSelectedServiceLinesFromSubcategory,
  shouldAllowDurationControl,
  shouldAllowQuantityControl,
  showApiErrorToast,
} from '@/utils';

const CATALOG_USAGE_TYPES: CategoryCatalogUsageTypes = ['MAIN', 'ICON'];

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

export function useBookingDraftDetailsScreenController(
  args: BookingDraftDetailsScreenControllerArgs,
): BookingDraftDetailsScreenControllerValue {
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
    subcategoryId,
    bookingType: contextBookingType,
    scheduledDate: contextScheduledDate,
    scheduledTime: contextScheduledTime,
    address: contextAddress,
    notes: contextNotes,
    updateBookingDraft,
    setBookingQuote,
    setCategory,
    setSubcategory,
    setServicePriceOption,
    setServiceQuantity,
    setServiceDuration,
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
  const [bookingDetailsRefreshing, setBookingDetailsRefreshing] = useState(false);
  const [timeOptionsGeneratedAt, setTimeOptionsGeneratedAt] = useState(() => Date.now());

  const dateChoices = useMemo(buildNextBookingDateChoices, []);
  const timeOptions = useMemo(
    () => buildBookingTimeOptions(scheduledDate, new Date(timeOptionsGeneratedAt)),
    [scheduledDate, timeOptionsGeneratedAt],
  );
  const selectedDurationByService = useMemo(
    () => selectedServices.reduce<Record<string, number>>((accumulator, line) => {
      if (typeof line.selectedDurationMinutes === 'number') {
        accumulator[line.service.id] = line.selectedDurationMinutes;
      }
      return accumulator;
    }, {}),
    [selectedServices],
  );

  const resolvedLocation = useMemo(() => resolveProductLocation({
    city,
    locality,
    state,
    formattedAddress,
    latitude,
    longitude,
  }), [city, formattedAddress, latitude, locality, longitude, state]);
  const selectedCity = resolvedLocation.serviceableCity ?? '';

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
    setTimeOptionsGeneratedAt(Date.now());
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
    if (
      bookingType !== CUSTOMER_BOOKING_TYPE.SCHEDULED
      || scheduledDate !== getDefaultBookingDateValue()
    ) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeOptionsGeneratedAt(Date.now());
    }, 60_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [bookingType, scheduledDate]);

  useEffect(() => {
    if (!scheduledDate) {
      return;
    }

    if (!scheduledTime || timeOptions.includes(scheduledTime)) {
      return;
    }

    setScheduledTimeState('');
  }, [scheduledDate, scheduledTime, timeOptions]);

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
      const existingSelection = line.selectedDurationMinutes;
      const defaultDuration = typeof existingSelection === 'number' ? existingSelection : allowedDurations[0];
      if (existingSelection !== defaultDuration) {
        setServiceDuration(line.service.id, defaultDuration);
      }
    });
  }, [selectedServices, setServiceDuration, setServiceQuantity]);

  const hasMissingPriceSelection = selectedServices.some(line =>
    getRequiredPriceOptions(line.service.priceOptions).length > 0
      && !line.selectedPriceOptionId,
  );

  const hasValidSchedule = bookingType === CUSTOMER_BOOKING_TYPE.INSTANT
    || (
      Boolean(buildScheduledStartAt(scheduledDate, scheduledTime))
      && isBookingTimeOptionAvailable(scheduledDate, scheduledTime)
    );
  const canReview = selectedServices.length > 0
    && !hasMissingPriceSelection
    && isBookingAddressComplete(addressDraft)
    && hasValidSchedule;

  const currentLocationSummary = buildAddressSummary(detectedAddressDraft) || APP_TEXT.main.bookingFlow.currentLocationEmptyHint;
  const currentLocationPrimaryLine = buildLocationPrimaryLine(detectedAddressDraft) || resolvedLocation.displayCity || 'Location not ready';
  const pinnedLocationSummary = buildAddressSummary(addressDraft) || APP_TEXT.main.bookingFlow.pinLocationEmptyHint;
  const pinnedLocationPrimaryLine = buildLocationPrimaryLine(addressDraft) || APP_TEXT.main.bookingFlow.pinLocationFallbackTitle;

  const setBookingType = (next: typeof contextBookingType) => {
    setTimeOptionsGeneratedAt(Date.now());
    setBookingTypeState(next);
    if (next === CUSTOMER_BOOKING_TYPE.INSTANT) {
      setScheduledDateState('');
      setScheduledTimeState('');
      return;
    }

    setScheduledDateState(getDefaultBookingDateValue());
    setScheduledTimeState('');
  };

  const setScheduledDate = (next: string) => {
    setTimeOptionsGeneratedAt(Date.now());
    setScheduledDateState(next);
    setScheduledTimeState('');
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

  const refreshBookingDetails = async () => {
    const resolvedSubcategoryId = (subcategoryId ?? selectedServices[0]?.service.subCategory?.id ?? '').trim();
    if (!resolvedSubcategoryId || !selectedCity) {
      return;
    }

    setBookingDetailsRefreshing(true);
    try {
      const subcategory = await customerActions.getCustomerSubcategoryById(resolvedSubcategoryId, {
        city: selectedCity,
        includeCategory: true,
        includeServices: true,
        includePriceOptions: true,
        includeTask: true,
        includeImage: true,
        usageType: CATALOG_USAGE_TYPES,
      });
      const maybeCategory = (subcategory as unknown as { category?: CustomerHomeCategory }).category;
      const refreshedSelectedServicesById = refreshSelectedServiceLinesFromSubcategory(
        selectedServices,
        subcategory,
        maybeCategory,
      );
      const nextDefaultDate = getDefaultBookingDateValue();
      const nextDefaultTime = getNextBookingTimeValue();
      const nextAddressDraft = {
        ...detectedAddressDraft,
        mode: 'google',
        addressLine2: '',
      } satisfies BookingFlowAddressDraft;

      if (maybeCategory) {
        setCategory({ id: maybeCategory.id, name: maybeCategory.name });
      }
      setSubcategory({ id: subcategory.id, name: subcategory.name });
      updateBookingDraft('selectedServicesById', refreshedSelectedServicesById);
      setBookingQuote(null);
      setTimeOptionsGeneratedAt(Date.now());
      setBookingTypeState(CUSTOMER_BOOKING_TYPE.INSTANT);
      setScheduledDateState('');
      setScheduledTimeState('');
      setAddressDraft(nextAddressDraft);
      setNotes('');
      setBookingDetails({
        bookingType: CUSTOMER_BOOKING_TYPE.INSTANT,
        scheduledDate: nextDefaultDate,
        scheduledTime: nextDefaultTime,
        address: nextAddressDraft,
        notes: '',
      });

      if (Object.keys(refreshedSelectedServicesById).length === 0) {
        args.onNavigateBackToServices();
      }
    } catch (refreshError) {
      showApiErrorToast(getErrorMessage(refreshError, APP_TEXT.main.bookingFlow.loadingError));
    } finally {
      setBookingDetailsRefreshing(false);
    }
  };

  const setAddressMode = (mode: BookingFlowAddressDraft['mode']) => {
    if (mode === 'google') {
      const nextDraft = {
        ...detectedAddressDraft,
        mode: 'google',
        addressLine2: addressDraft.addressLine2,
      } satisfies BookingFlowAddressDraft;
      setAddressDraft(nextDraft);
      setBookingAddress(nextDraft);
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
    service: BookingDraftDetailsScreenControllerValue['selectedServices'][number]['service'],
    selectedPriceOptionId: string | null,
    minutes: number,
  ) => {
    const priceOption = service.priceOptions?.find(option => option.id === selectedPriceOptionId);
    if (!shouldAllowDurationControl(priceOption ?? null)) return;
    setServiceDuration(service.id, minutes);
  };

  const decreaseServiceQuantity = (serviceId: string, quantity: number) => {
    setServiceQuantity(serviceId, quantity - 1);
  };

  const increaseServiceQuantity = (serviceId: string, quantity: number) => {
    setServiceQuantity(serviceId, quantity + 1);
  };

  const removeSelectedService = (serviceId: string) => {
    const willRemoveLastService = selectedServices.length <= 1
      && selectedServices.some(line => line.service.id === serviceId);
    removeService(serviceId);
    if (willRemoveLastService) {
      args.onNavigateBackToServices();
    }
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
    bookingDetailsRefreshing,
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
    refreshBookingDetails,
    selectServicePriceOption,
    selectServiceDuration,
    decreaseServiceQuantity,
    increaseServiceQuantity,
    removeSelectedService,
    reviewBooking,
  };
}
