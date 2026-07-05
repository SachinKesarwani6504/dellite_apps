import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { apiGet } from '@/actions/http/httpClient';
import type { Booking } from '@/types/api';
import { buildCustomerBookingsListPath } from '@/utils/customer-bookings';

const ONGOING_BOOKINGS_LIMIT = 12;

export function useCustomerOngoingBookings(enabled = true) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    try {
      const url = buildCustomerBookingsListPath({
        page: 1,
        limit: ONGOING_BOOKINGS_LIMIT,
        tab: 'ONGOING',
      });
      const response = await apiGet<{ data: Booking[] }>(url, { auth: true });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    items,
    loading,
    refresh,
    hasOngoingBookings: items.length > 0,
  };
}
