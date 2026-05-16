import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  BookingDetailsContextValue,
  BookingDetailsControllerArgs,
  BookingDetailsHistoryItem,
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

function normalizeHistoryItem(item: unknown): BookingDetailsHistoryItem | null {
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
}

function normalizeBookingDetails(details: BookingDetailsResponse | null): BookingDetailsResponse | null {
  if (!details) return null;
  const historyRaw = (details as { history?: unknown }).history;
  const history = Array.isArray(historyRaw)
    ? historyRaw.map(normalizeHistoryItem).filter((item): item is BookingDetailsHistoryItem => Boolean(item))
    : [];
  return {
    ...details,
    history,
  };
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
      setDetails(normalizeBookingDetails(unwrapBookingDetails(response)));
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
