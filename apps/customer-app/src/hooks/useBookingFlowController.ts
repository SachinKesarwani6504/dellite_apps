import { useCallback, useMemo, useRef, useState } from 'react';
import { customerActions } from '@/actions';
import type {
  BookingFlowDraft,
  BookingFlowQuote,
  BookingFlowContextType,
  BookingFlowDetailsDraft,
  BookingFlowEntityPayload,
  BookingFlowSelectedServiceLine,
  BookingFlowStartPayload,
} from '@/types/booking-flow-context';
import { CUSTOMER_BOOKING_TYPE } from '@/types/customer';
import type { CustomerBookableService } from '@/types/customer';
import {
  buildCreateBookingPayload,
  buildLocalBookingQuote,
  createEmptyAddressDraft,
  createSelectedServiceLine,
  getDefaultBookingDateValue,
  getNextBookingTimeValue,
} from '@/utils/booking-flow';

function createDefaultDetailsDraft(): BookingFlowDetailsDraft {
  return {
    bookingType: CUSTOMER_BOOKING_TYPE.INSTANT,
    scheduledDate: getDefaultBookingDateValue(),
    scheduledTime: getNextBookingTimeValue(),
    address: createEmptyAddressDraft(),
    notes: '',
  };
}

function createDefaultBookingDraft(): BookingFlowDraft {
  return {
    sourceType: null,
    categoryId: null,
    categoryName: null,
    subcategoryId: null,
    subcategoryName: null,
    selectedServicesById: {},
    details: createDefaultDetailsDraft(),
  };
}

function upsertSelectedServiceLine(
  current: Record<string, BookingFlowSelectedServiceLine>,
  service: CustomerBookableService,
) {
  const next = { ...current };
  if (next[service.id]) {
    delete next[service.id];
    return next;
  }

  next[service.id] = createSelectedServiceLine(service);
  return next;
}

export function useBookingFlowController(): BookingFlowContextType {
  const [bookingDraft, setBookingDraft] = useState<BookingFlowDraft>(createDefaultBookingDraft);
  const [bookingQuote, setBookingQuote] = useState<BookingFlowQuote | null>(null);
  const lastToggleRef = useRef<{ serviceId: string; timestamp: number } | null>(null);

  const updateBookingDraft = useCallback(<Key extends keyof BookingFlowDraft>(key: Key, value: BookingFlowDraft[Key]) => {
    setBookingDraft(current => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const beginFlow = useCallback((payload: BookingFlowStartPayload) => {
    setBookingDraft({
      ...createDefaultBookingDraft(),
      sourceType: payload.sourceType,
      categoryId: payload.categoryId ?? null,
      selectedServicesById: payload.service ? { [payload.service.id]: createSelectedServiceLine(payload.service) } : {},
    });
    setBookingQuote(null);
  }, []);

  const setCategory = useCallback((payload: BookingFlowEntityPayload) => {
    setBookingDraft(current => ({
      ...current,
      categoryId: payload.id,
      categoryName: payload.name ?? null,
    }));
    setBookingQuote(null);
  }, []);

  const setSubcategory = useCallback((payload: BookingFlowEntityPayload) => {
    setBookingDraft(current => ({
      ...current,
      subcategoryId: payload.id,
      subcategoryName: payload.name ?? null,
      selectedServicesById: current.subcategoryId && current.subcategoryId !== payload.id
        ? {}
        : current.selectedServicesById,
    }));
    setBookingQuote(null);
  }, []);

  const toggleService = useCallback((service: CustomerBookableService) => {
    const normalizedServiceId = String(service.id ?? '').trim();
    if (!normalizedServiceId) return;

    const now = Date.now();
    const previousToggle = lastToggleRef.current;
    if (
      previousToggle?.serviceId === normalizedServiceId
      && now - previousToggle.timestamp < 300
    ) {
      return;
    }
    lastToggleRef.current = { serviceId: normalizedServiceId, timestamp: now };

    setBookingDraft(current => ({
      ...current,
      selectedServicesById: upsertSelectedServiceLine(current.selectedServicesById, {
        ...service,
        id: normalizedServiceId,
      }),
    }));
    setBookingQuote(null);
  }, []);

  const resetSelectedServices = useCallback(() => {
    setBookingDraft(current => ({
      ...current,
      selectedServicesById: {},
    }));
    setBookingQuote(null);
  }, []);

  const clearSubcategorySelection = useCallback(() => {
    setBookingDraft(current => ({
      ...current,
      subcategoryId: null,
      subcategoryName: null,
      selectedServicesById: {},
    }));
    setBookingQuote(null);
  }, []);

  const setServiceQuantity = useCallback((serviceId: string, quantity: number) => {
    setBookingDraft((current) => {
      const currentLine = current.selectedServicesById[serviceId];
      if (!currentLine) return current;
      return {
        ...current,
        selectedServicesById: {
          ...current.selectedServicesById,
          [serviceId]: {
            ...currentLine,
            quantity: Math.max(1, Math.min(quantity, 20)),
          },
        },
      };
    });
    setBookingQuote(null);
  }, []);

  const setServicePriceOption = useCallback((serviceId: string, priceOptionId: string) => {
    setBookingDraft((current) => {
      const currentLine = current.selectedServicesById[serviceId];
      if (!currentLine) return current;
      return {
        ...current,
        selectedServicesById: {
          ...current.selectedServicesById,
          [serviceId]: {
            ...currentLine,
            selectedPriceOptionId: priceOptionId,
            selectedDurationMinutes: null,
          },
        },
      };
    });
    setBookingQuote(null);
  }, []);

  const setServiceDuration = useCallback((serviceId: string, minutes: number | null) => {
    setBookingDraft((current) => {
      const currentLine = current.selectedServicesById[serviceId];
      if (!currentLine) return current;
      return {
        ...current,
        selectedServicesById: {
          ...current.selectedServicesById,
          [serviceId]: {
            ...currentLine,
            selectedDurationMinutes: minutes,
          },
        },
      };
    });
    setBookingQuote(null);
  }, []);

  const removeService = useCallback((serviceId: string) => {
    setBookingDraft((current) => {
      if (!current.selectedServicesById[serviceId]) return current;
      const next = { ...current.selectedServicesById };
      delete next[serviceId];
      return {
        ...current,
        selectedServicesById: next,
      };
    });
    setBookingQuote(null);
  }, []);

  const setBookingDetails = useCallback((payload: BookingFlowDetailsDraft) => {
    setBookingDraft(current => ({
      ...current,
      details: payload,
    }));
    setBookingQuote(null);
  }, []);

  const setBookingAddress = useCallback((address: BookingFlowDetailsDraft['address']) => {
    setBookingDraft(current => ({
      ...current,
      details: {
        ...current.details,
        address,
      },
    }));
    setBookingQuote(null);
  }, []);

  const createBooking = useCallback(async (city: string) => {
    const payload = buildCreateBookingPayload({
      city,
      bookingDraft,
    });

    return customerActions.createCustomerBooking(payload);
  }, [bookingDraft]);

  const fetchBookingQuote = useCallback(async () => {
    try {
      const response = await customerActions.getCustomerBookingQuote({
        bookingDraft,
      });
      const nextQuote = {
        ...response.bookingQuote,
        isEstimated: response.bookingQuote.isEstimated ?? false,
      };
      setBookingQuote(nextQuote);
      return nextQuote;
    } catch {
      const fallbackQuote = buildLocalBookingQuote(bookingDraft);
      setBookingQuote(fallbackQuote);
      return fallbackQuote;
    }
  }, [bookingDraft]);

  const resetFlow = useCallback(() => {
    setBookingDraft(createDefaultBookingDraft());
    setBookingQuote(null);
  }, []);

  const selectedServices = useMemo(() => Object.values(bookingDraft.selectedServicesById), [bookingDraft.selectedServicesById]);
  const selectedServiceIds = useMemo(
    () =>
      Object.keys(bookingDraft.selectedServicesById).reduce<Record<string, true>>((accumulator, id) => {
        accumulator[id] = true;
        return accumulator;
      }, {}),
    [bookingDraft.selectedServicesById],
  );

  return useMemo(() => ({
    bookingDraft,
    bookingQuote,
    sourceType: bookingDraft.sourceType,
    categoryId: bookingDraft.categoryId,
    categoryName: bookingDraft.categoryName,
    subcategoryId: bookingDraft.subcategoryId,
    subcategoryName: bookingDraft.subcategoryName,
    selectedServices,
    selectedServiceIds,
    selectedServicesById: bookingDraft.selectedServicesById,
    bookingType: bookingDraft.details.bookingType,
    scheduledDate: bookingDraft.details.scheduledDate,
    scheduledTime: bookingDraft.details.scheduledTime,
    address: bookingDraft.details.address,
    notes: bookingDraft.details.notes,
    updateBookingDraft,
    setBookingQuote,
    fetchBookingQuote,
    beginFlow,
    setCategory,
    setSubcategory,
    toggleService,
    resetSelectedServices,
    clearSubcategorySelection,
    setServiceQuantity,
    setServicePriceOption,
    setServiceDuration,
    removeService,
    setBookingAddress,
    setBookingDetails,
    createBooking,
    resetFlow,
  }), [
    bookingDraft,
    bookingQuote,
    selectedServices,
    selectedServiceIds,
    updateBookingDraft,
    beginFlow,
    setCategory,
    setSubcategory,
    toggleService,
    resetSelectedServices,
    clearSubcategorySelection,
    setServiceQuantity,
    setServicePriceOption,
    setServiceDuration,
    removeService,
    setBookingAddress,
    setBookingDetails,
    createBooking,
    fetchBookingQuote,
    resetFlow,
  ]);
}
