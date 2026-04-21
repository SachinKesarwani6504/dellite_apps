import { useCallback, useMemo, useState } from 'react';
import { customerActions } from '@/actions';
import type { CustomerHomeCategory } from '@/types/customer';
import type { BookingFlowContextType, BookingFlowService, BookingFlowSourceType } from '@/types/booking-flow-context';
import type { BookingSlotValue } from '@/utils/options';

const DEFAULT_SLOT_VALUE: BookingSlotValue = 'morning';
const DEFAULT_SLOT_LABEL = 'Today Morning (9:00 AM - 12:00 PM)';

export function useBookingFlowController(): BookingFlowContextType {
  const [sourceType, setSourceType] = useState<BookingFlowSourceType | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [subcategoryName, setSubcategoryName] = useState<string | null>(null);
  const [selectedServicesById, setSelectedServicesById] = useState<Record<string, BookingFlowService>>({});
  const [catalog, setCatalog] = useState<CustomerHomeCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [slotValue, setSlotValue] = useState<BookingSlotValue>(DEFAULT_SLOT_VALUE);
  const [slotLabel, setSlotLabel] = useState(DEFAULT_SLOT_LABEL);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const beginFlow = useCallback((payload: { sourceType: BookingFlowSourceType; categoryId?: string; service?: BookingFlowService }) => {
    setSourceType(payload.sourceType);
    setCategoryId(payload.categoryId ?? null);
    setCategoryName(null);
    setSubcategoryId(null);
    setSubcategoryName(null);
    setSelectedServicesById(payload.service ? { [payload.service.id]: payload.service } : {});
    setSlotValue(DEFAULT_SLOT_VALUE);
    setSlotLabel(DEFAULT_SLOT_LABEL);
    setAddress('');
    setNotes('');
  }, []);

  const setCategory = useCallback((payload: { id: string; name?: string | null }) => {
    setCategoryId(payload.id);
    setCategoryName(payload.name ?? null);
  }, []);

  const setSubcategory = useCallback((payload: { id: string; name?: string | null }) => {
    setSubcategoryId(currentId => {
      if (currentId && currentId !== payload.id) {
        setSelectedServicesById({});
      }
      return payload.id;
    });
    setSubcategoryName(payload.name ?? null);
  }, []);

  const toggleService = useCallback((service: BookingFlowService) => {
    setSelectedServicesById(prev => {
      const next = { ...prev };
      if (next[service.id]) {
        delete next[service.id];
      } else {
        next[service.id] = service;
      }
      return next;
    });
  }, []);

  const resetSelectedServices = useCallback(() => {
    setSelectedServicesById({});
  }, []);

  const clearSubcategorySelection = useCallback(() => {
    setSubcategoryId(null);
    setSubcategoryName(null);
    setSelectedServicesById({});
  }, []);

  const setBookingDetails = useCallback((payload: {
    slotValue: BookingSlotValue;
    slotLabel: string;
    address: string;
    notes: string;
  }) => {
    setSlotValue(payload.slotValue);
    setSlotLabel(payload.slotLabel);
    setAddress(payload.address);
    setNotes(payload.notes);
  }, []);

  const loadCatalog = useCallback(async (city: string, forceRefresh: boolean) => {
    if (!forceRefresh && catalog.length > 0) {
      return catalog;
    }

    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const nextCatalog = await customerActions.getCustomerServiceCatalog({
        city,
        includeSubcategory: true,
        includeServices: true,
        includePriceOptions: true,
        includeImage: true,
        usageType: ['MAIN', 'ICON'],
      });
      setCatalog(nextCatalog);
      return nextCatalog;
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setCatalogError(error.message);
      } else {
        setCatalogError('Unable to load services right now.');
      }
      return [];
    } finally {
      setCatalogLoading(false);
    }
  }, [catalog]);

  const ensureCatalog = useCallback((city: string) => loadCatalog(city, false), [loadCatalog]);
  const refreshCatalog = useCallback((city: string) => loadCatalog(city, true), [loadCatalog]);

  const resetFlow = useCallback(() => {
    setSourceType(null);
    setCategoryId(null);
    setCategoryName(null);
    setSubcategoryId(null);
    setSubcategoryName(null);
    setSelectedServicesById({});
    setCatalog([]);
    setCatalogError(null);
    setSlotValue(DEFAULT_SLOT_VALUE);
    setSlotLabel(DEFAULT_SLOT_LABEL);
    setAddress('');
    setNotes('');
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
    catalog,
    catalogLoading,
    catalogError,
    slotValue,
    slotLabel,
    address,
    notes,
    beginFlow,
    setCategory,
    setSubcategory,
    toggleService,
    resetSelectedServices,
    clearSubcategorySelection,
    setBookingDetails,
    ensureCatalog,
    refreshCatalog,
    resetFlow,
  }), [
    sourceType,
    categoryId,
    categoryName,
    subcategoryId,
    subcategoryName,
    selectedServices,
    selectedServiceIds,
    catalog,
    catalogLoading,
    catalogError,
    slotValue,
    slotLabel,
    address,
    notes,
    beginFlow,
    setCategory,
    setSubcategory,
    toggleService,
    resetSelectedServices,
    clearSubcategorySelection,
    setBookingDetails,
    ensureCatalog,
    refreshCatalog,
    resetFlow,
  ]);
}
