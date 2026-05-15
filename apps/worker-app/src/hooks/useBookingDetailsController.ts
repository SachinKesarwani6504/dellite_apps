import { useCallback, useMemo, useState } from 'react';
import { apiPatch } from '@/actions/http/httpClient';
import { useApiGet } from '@/hooks/useApiGet';
import type { ApiEnvelope } from '@/types/api';
import type {
  BookingDetailsResponse,
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
    details: data,
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
