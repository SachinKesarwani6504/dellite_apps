import { useCallback, useEffect, useMemo, useState } from 'react';
import { customerActions } from '@/actions';
import { apiGet } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { BookingEditLineDraft } from '@/types/booking-edit';
import type { CustomerBookableService } from '@/types/customer';
import type {
  BookingDetailsResponse,
  BookingDetailsServiceLine,
} from '@/types/booking-details';
import type { CustomerBookingUpdatePayload } from '@/types/booking-actions';
import { APP_TEXT } from '@/utils/appText';
import { canCustomerEditBooking } from '@/utils/booking-actions';
import { getBookingDetailsPath, getBookingLineDurationMinutes, getBookingLineKey, getBookingLineQuantity } from '@/utils/booking-details';
import {
  buildFallbackEditableService,
  ensureEditableServiceIncludesSelectedPriceOption,
  getInitialBookingEditLineDraft,
  getEditableSelectedPriceOption,
  getEditableDurationMinutes,
} from '@/utils/booking-edit';
import { getFixedDurationMinutes } from '@/utils/booking-flow';
import { getErrorMessage } from '@/utils/error-message';

function unwrapBookingDetails(payload: BookingDetailsResponse | ApiEnvelope<BookingDetailsResponse>) {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<BookingDetailsResponse>).data ?? null;
  }
  return payload as BookingDetailsResponse;
}

export function useBookingEditController(bookingId: string) {
  const [details, setDetails] = useState<BookingDetailsResponse | null>(null);
  const [serviceByLineKey, setServiceByLineKey] = useState<Record<string, CustomerBookableService>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [lineDrafts, setLineDrafts] = useState<Record<string, BookingEditLineDraft>>({});

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<BookingDetailsResponse | ApiEnvelope<BookingDetailsResponse>>(
        getBookingDetailsPath(bookingId, 'CUSTOMER'),
        {
          auth: true,
          cache: 'no-store',
        },
      );
      const nextDetails = unwrapBookingDetails(response);
      setDetails(nextDetails);
      setNotes(nextDetails?.booking.notes ?? '');
      const nextIsEditable = canCustomerEditBooking(nextDetails);
      if (!nextIsEditable) {
        setError(APP_TEXT.main.bookings.editUnavailableDescription);
      }
      const nextLineDrafts = (nextDetails?.serviceLines ?? []).reduce<Record<string, BookingEditLineDraft>>((acc, line) => {
        acc[getBookingLineKey(line)] = getInitialBookingEditLineDraft(line);
        return acc;
      }, {});
      setLineDrafts(nextLineDrafts);

      const cityName = nextDetails?.booking.city?.name?.trim() ?? '';
      const lineServices = await Promise.all((nextDetails?.serviceLines ?? []).map(async (line) => {
        const lineKey = getBookingLineKey(line);
        if (!line.serviceId || !cityName) {
          return [lineKey, buildFallbackEditableService(line)] as const;
        }

        try {
          const service = await customerActions.getCustomerServiceById(line.serviceId, {
            city: cityName,
            includeCategory: true,
            includeSubcategory: true,
            includePriceOptions: true,
            includeTask: true,
            includeImage: true,
          });
          return [lineKey, ensureEditableServiceIncludesSelectedPriceOption(service, line)] as const;
        } catch {
          return [lineKey, buildFallbackEditableService(line)] as const;
        }
      }));
      setServiceByLineKey(Object.fromEntries(lineServices));
    } catch (loadError) {
      setDetails(null);
      setServiceByLineKey({});
      setError(getErrorMessage(loadError, 'Unable to load booking edit details.'));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const isEditable = canCustomerEditBooking(details);

  const getLineDraft = useCallback((line: BookingDetailsServiceLine) => {
    return lineDrafts[getBookingLineKey(line)] ?? getInitialBookingEditLineDraft(line);
  }, [lineDrafts]);

  const increaseQuantity = useCallback((line: BookingDetailsServiceLine) => {
    const lineKey = getBookingLineKey(line);
    setLineDrafts(current => ({
      ...current,
      [lineKey]: {
        ...getLineDraft(line),
        quantity: getLineDraft(line).quantity + 1,
      },
    }));
  }, [getLineDraft]);

  const selectLineDuration = useCallback((line: BookingDetailsServiceLine, minutes: number) => {
    const originalDuration = getBookingLineDurationMinutes(line);
    if (originalDuration != null && minutes < originalDuration) return;
    const lineKey = getBookingLineKey(line);
    setLineDrafts(current => ({
      ...current,
      [lineKey]: {
        ...getLineDraft(line),
        durationMinutes: minutes,
      },
    }));
  }, [getLineDraft]);

  const selectLinePriceOption = useCallback((line: BookingDetailsServiceLine, priceOptionId: string) => {
    const lineKey = getBookingLineKey(line);
    const service = serviceByLineKey[lineKey] ?? buildFallbackEditableService(line);
    const selectedPriceOption = service.priceOptions?.find(option => option.id === priceOptionId) ?? null;
    const fixedDurationMinutes = getFixedDurationMinutes(selectedPriceOption);
    const originalDuration = getBookingLineDurationMinutes(line);
    if (fixedDurationMinutes != null && originalDuration != null && fixedDurationMinutes < originalDuration) return;

    setLineDrafts(current => ({
      ...current,
      [lineKey]: {
        ...getLineDraft(line),
        selectedPriceOptionId: priceOptionId,
        durationMinutes: fixedDurationMinutes ?? getLineDraft(line).durationMinutes,
      },
    }));
  }, [getLineDraft, serviceByLineKey]);

  const payload = useMemo<CustomerBookingUpdatePayload>(() => {
    const serviceLineUpdates = (details?.serviceLines ?? [])
      .map((line) => {
        if (!line.id) return null;
        const draft = getLineDraft(line);
        const lineKey = getBookingLineKey(line);
        const service = serviceByLineKey[lineKey] ?? buildFallbackEditableService(line);
        const selectedPriceOption = getEditableSelectedPriceOption(service, line, draft);
        const draftDurationMinutes = getEditableDurationMinutes(selectedPriceOption, draft);
        const originalQuantity = getBookingLineQuantity(line);
        const originalDuration = getBookingLineDurationMinutes(line);
        const nextUpdate = {
          serviceLineId: line.id,
          quantity: draft.quantity > originalQuantity ? draft.quantity : undefined,
          selectedDurationMinutes: (
            draftDurationMinutes != null
            && originalDuration != null
            && draftDurationMinutes > originalDuration
          ) ? draftDurationMinutes : undefined,
        };
        return nextUpdate.quantity || nextUpdate.selectedDurationMinutes ? nextUpdate : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      notes: notes !== (details?.booking.notes ?? '') ? notes : undefined,
      serviceLineUpdates: serviceLineUpdates.length > 0 ? serviceLineUpdates : undefined,
    };
  }, [details?.booking.notes, details?.serviceLines, getLineDraft, notes, serviceByLineKey]);

  const canSave = Boolean(
    payload.notes !== undefined
    || (payload.serviceLineUpdates?.length ?? 0) > 0,
  );

  const saveChanges = useCallback(async () => {
    if (!details || !isEditable) {
      setError(APP_TEXT.main.bookings.editUnavailableDescription);
      return false;
    }

    if (!canSave) {
      return false;
    }

    setSaving(true);
    setError(null);
    try {
      await customerActions.updateCustomerBooking(bookingId, payload);
      await loadDetails();
      return true;
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Unable to update booking.'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [bookingId, canSave, details, isEditable, loadDetails, payload]);

  return {
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
    refresh: loadDetails,
  };
}
