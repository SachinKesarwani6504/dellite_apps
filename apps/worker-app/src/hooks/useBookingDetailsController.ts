import { useCallback, useMemo, useState } from 'react';
import { apiPatch } from '@/actions/http/httpClient';
import { useApiGet } from '@/hooks/useApiGet';
import type { ApiEnvelope } from '@/types/api';
import type {
  BookingDetailsResponse,
  BookingDetailsHistoryItem,
  BookingDetailsRole,
  BookingDetailsServiceLine,
  UpdateBookingPayload,
} from '@/types/booking-details';
import {
  BOOKING_DURATION_STEP_MINUTES,
  buildBookingDurationPatch,
  buildBookingQuantityPatch,
  getBookingDetailsPath,
  getBookingLineDurationMinutes,
  getBookingLineKey,
  getBookingLineQuantity,
} from '@/utils/booking-details';
import { getErrorMessage } from '@/utils';

export function useBookingDetailsController(bookingId: string, role: BookingDetailsRole) {
  const detailsPath = useMemo(() => getBookingDetailsPath(bookingId, role), [bookingId, role]);
  const {
    data,
    loading,
    error,
    refetch,
  } = useApiGet<BookingDetailsResponse>(detailsPath);
  const [updatingLineKey, setUpdatingLineKey] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const normalizedDetails = useMemo(() => {
    if (!data) return null;
    const historyRaw = (data as { history?: unknown }).history;
    const history = Array.isArray(historyRaw)
      ? historyRaw
        .map((item): BookingDetailsHistoryItem | null => {
          if (!item || typeof item !== 'object') return null;
          const raw = item as Record<string, unknown>;
          const id = typeof raw.id === 'string' ? raw.id : null;
          const title = typeof raw.title === 'string' ? raw.title : null;
          const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : null;
          if (!id || !title || !createdAt) return null;
          return {
            id,
            title,
            description: typeof raw.description === 'string' ? raw.description : null,
            createdAt,
            metadata: raw.metadata && typeof raw.metadata === 'object'
              ? (raw.metadata as Record<string, unknown>)
              : null,
          };
        })
        .filter((item): item is BookingDetailsHistoryItem => Boolean(item))
      : [];
    return {
      ...data,
      history,
    };
  }, [data]);

  const patchBooking = useCallback(async (line: BookingDetailsServiceLine, payload: UpdateBookingPayload) => {
    const lineKey = getBookingLineKey(line);
    setUpdatingLineKey(lineKey);
    setUpdateError(null);
    try {
      await apiPatch<ApiEnvelope<BookingDetailsResponse>, UpdateBookingPayload>(
        `/booking/${encodeURIComponent(bookingId)}`,
        payload,
        { auth: true },
      );
      await refetch();
    } catch (patchError) {
      setUpdateError(getErrorMessage(patchError, 'Unable to update booking details.'));
    } finally {
      setUpdatingLineKey(null);
    }
  }, [bookingId, refetch]);

  const updateQuantity = useCallback(async (line: BookingDetailsServiceLine, nextQuantity: number) => {
    const quantity = Math.max(1, nextQuantity);
    await patchBooking(line, buildBookingQuantityPatch(line, quantity));
  }, [patchBooking]);

  const increaseQuantity = useCallback(async (line: BookingDetailsServiceLine) => {
    await updateQuantity(line, getBookingLineQuantity(line) + 1);
  }, [updateQuantity]);

  const decreaseQuantity = useCallback(async (line: BookingDetailsServiceLine) => {
    await updateQuantity(line, getBookingLineQuantity(line) - 1);
  }, [updateQuantity]);

  const updateDuration = useCallback(async (line: BookingDetailsServiceLine, nextMinutes: number) => {
    const minutes = Math.max(BOOKING_DURATION_STEP_MINUTES, nextMinutes);
    await patchBooking(line, buildBookingDurationPatch(line, minutes));
  }, [patchBooking]);

  const increaseDuration = useCallback(async (line: BookingDetailsServiceLine) => {
    const currentMinutes = getBookingLineDurationMinutes(line) ?? BOOKING_DURATION_STEP_MINUTES;
    await updateDuration(line, currentMinutes + BOOKING_DURATION_STEP_MINUTES);
  }, [updateDuration]);

  const decreaseDuration = useCallback(async (line: BookingDetailsServiceLine) => {
    const currentMinutes = getBookingLineDurationMinutes(line) ?? BOOKING_DURATION_STEP_MINUTES;
    await updateDuration(line, currentMinutes - BOOKING_DURATION_STEP_MINUTES);
  }, [updateDuration]);

  return {
    details: normalizedDetails,
    loading,
    error: error ?? updateError,
    updatingLineKey,
    refetch,
    increaseQuantity,
    decreaseQuantity,
    increaseDuration,
    decreaseDuration,
  };
}
