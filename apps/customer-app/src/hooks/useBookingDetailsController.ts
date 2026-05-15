import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  BookingDetailsContextValue,
  BookingDetailsControllerArgs,
  BookingDetailsResponse,
} from '@/types/booking-details';
import { getBookingDetailsPath } from '@/utils/booking-details';
import { getErrorMessage } from '@/utils/error-message';

function unwrapBookingDetails(payload: BookingDetailsResponse | ApiEnvelope<BookingDetailsResponse>) {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<BookingDetailsResponse>).data ?? null;
  }
  return payload as BookingDetailsResponse;
}

export function useBookingDetailsController({
  bookingId,
  role,
}: BookingDetailsControllerArgs): BookingDetailsContextValue {
  const detailsPath = useMemo(() => getBookingDetailsPath(bookingId, role), [bookingId, role]);
  const [details, setDetails] = useState<BookingDetailsResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await apiGet<BookingDetailsResponse | ApiEnvelope<BookingDetailsResponse>>(detailsPath, {
        auth: true,
        cache: 'no-store',
      });
      setDetails(unwrapBookingDetails(response));
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load booking details.'));
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [detailsPath]);

  const refresh = useCallback(async () => {
    await fetchDetails('refresh');
  }, [fetchDetails]);

  useEffect(() => {
    void fetchDetails('initial');
  }, [fetchDetails]);

  return {
    details,
    isInitialLoading,
    isRefreshing,
    error,
    refresh,
  };
}
