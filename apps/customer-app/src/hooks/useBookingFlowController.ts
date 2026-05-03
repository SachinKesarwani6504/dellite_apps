import { useCallback, useMemo, useRef, useState } from 'react';
import { customerActions } from '@/actions';
import type {
  BookingFlowContextType,
  BookingFlowDetailsDraft,
  BookingFlowEntityPayload,
  BookingFlowSelectedServiceLine,
  BookingFlowSourceType,
  BookingFlowStartPayload,
} from '@/types/booking-flow-context';
import { CUSTOMER_BOOKING_TYPE } from '@/types/customer';
import type { CustomerBookableService } from '@/types/customer';
import {
  buildCreateBookingPayload,
  createEmptyAddressDraft,
  createSelectedServiceLine,
} from '@/utils/booking-flow';

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function getNextHourTimeValue() {
  const now = new Date();
  const hour = String(Math.min(now.getHours() + 1, 23)).padStart(2, '0');
  return `${hour}:00`;
}

function createDefaultDetailsDraft(): BookingFlowDetailsDraft {
  return {
    bookingType: CUSTOMER_BOOKING_TYPE.INSTANT,
    scheduledDate: getTodayDateValue(),
    scheduledTime: getNextHourTimeValue(),
    address: createEmptyAddressDraft(),
    notes: '',
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
  const [sourceType, setSourceType] = useState<BookingFlowSourceType | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [subcategoryName, setSubcategoryName] = useState<string | null>(null);
  const [selectedServicesById, setSelectedServicesById] = useState<Record<string, BookingFlowSelectedServiceLine>>({});
  const [detailsDraft, setDetailsDraft] = useState<BookingFlowDetailsDraft>(createDefaultDetailsDraft);
  const lastToggleRef = useRef<{ serviceId: string; timestamp: number } | null>(null);

  const beginFlow = useCallback((payload: BookingFlowStartPayload) => {
    setSourceType(payload.sourceType);
    setCategoryId(payload.categoryId ?? null);
    setCategoryName(null);
    setSubcategoryId(null);
    setSubcategoryName(null);
    setSelectedServicesById(payload.service ? { [payload.service.id]: createSelectedServiceLine(payload.service) } : {});
    setDetailsDraft(createDefaultDetailsDraft());
  }, []);

  const setCategory = useCallback((payload: BookingFlowEntityPayload) => {
    setCategoryId(payload.id);
    setCategoryName(payload.name ?? null);
  }, []);

  const setSubcategory = useCallback((payload: BookingFlowEntityPayload) => {
    setSubcategoryId((currentId) => {
      if (currentId && currentId !== payload.id) {
        setSelectedServicesById({});
      }
      return payload.id;
    });
    setSubcategoryName(payload.name ?? null);
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

    setSelectedServicesById(prev =>
      upsertSelectedServiceLine(prev, {
        ...service,
        id: normalizedServiceId,
      }),
    );
  }, []);

  const resetSelectedServices = useCallback(() => {
    setSelectedServicesById({});
  }, []);

  const clearSubcategorySelection = useCallback(() => {
    setSubcategoryId(null);
    setSubcategoryName(null);
    setSelectedServicesById({});
  }, []);

  const setServiceQuantity = useCallback((serviceId: string, quantity: number) => {
    setSelectedServicesById((prev) => {
      const current = prev[serviceId];
      if (!current) return prev;
      return {
        ...prev,
        [serviceId]: {
          ...current,
          quantity: Math.max(1, Math.min(quantity, 20)),
        },
      };
    });
  }, []);

  const setServicePriceOption = useCallback((serviceId: string, priceOptionId: string) => {
    setSelectedServicesById((prev) => {
      const current = prev[serviceId];
      if (!current) return prev;
      return {
        ...prev,
        [serviceId]: {
          ...current,
          selectedPriceOptionId: priceOptionId,
        },
      };
    });
  }, []);

  const removeService = useCallback((serviceId: string) => {
    setSelectedServicesById((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  }, []);

  const setBookingDetails = useCallback((payload: BookingFlowDetailsDraft) => {
    setDetailsDraft(payload);
  }, []);

  const createBooking = useCallback(async (city: string) => {
    const payload = buildCreateBookingPayload({
      city,
      bookingType: detailsDraft.bookingType,
      scheduledDate: detailsDraft.scheduledDate,
      scheduledTime: detailsDraft.scheduledTime,
      notes: detailsDraft.notes,
      address: detailsDraft.address,
      selectedServices: Object.values(selectedServicesById),
    });

    return customerActions.createCustomerBooking(payload);
  }, [detailsDraft, selectedServicesById]);

  const resetFlow = useCallback(() => {
    setSourceType(null);
    setCategoryId(null);
    setCategoryName(null);
    setSubcategoryId(null);
    setSubcategoryName(null);
    setSelectedServicesById({});
    setDetailsDraft(createDefaultDetailsDraft());
  }, []);

  const selectedServices = useMemo(() => Object.values(selectedServicesById), [selectedServicesById]);
  const selectedServiceIds = useMemo(
    () =>
      Object.keys(selectedServicesById).reduce<Record<string, true>>((accumulator, id) => {
        accumulator[id] = true;
        return accumulator;
      }, {}),
    [selectedServicesById],
  );

  return useMemo(() => ({
    sourceType,
    categoryId,
    categoryName,
    subcategoryId,
    subcategoryName,
    selectedServices,
    selectedServiceIds,
    bookingType: detailsDraft.bookingType,
    scheduledDate: detailsDraft.scheduledDate,
    scheduledTime: detailsDraft.scheduledTime,
    address: detailsDraft.address,
    notes: detailsDraft.notes,
    beginFlow,
    setCategory,
    setSubcategory,
    toggleService,
    resetSelectedServices,
    clearSubcategorySelection,
    setServiceQuantity,
    setServicePriceOption,
    removeService,
    setBookingDetails,
    createBooking,
    resetFlow,
  }), [
    sourceType,
    categoryId,
    categoryName,
    subcategoryId,
    subcategoryName,
    selectedServices,
    selectedServiceIds,
    detailsDraft.bookingType,
    detailsDraft.scheduledDate,
    detailsDraft.scheduledTime,
    detailsDraft.address,
    detailsDraft.notes,
    beginFlow,
    setCategory,
    setSubcategory,
    toggleService,
    resetSelectedServices,
    clearSubcategorySelection,
    setServiceQuantity,
    setServicePriceOption,
    removeService,
    setBookingDetails,
    createBooking,
    resetFlow,
  ]);
}
