import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import { getErrorMessage } from '@/utils';

function unwrapResponse<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

export function useApiGet<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url.trim()) {
      setData(null);
      setError('Invalid URL');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiGet<T | ApiEnvelope<T>>(url, {
        auth: true,
        cache: 'no-store',
      });
      setData(unwrapResponse<T>(response));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiGet<T | ApiEnvelope<T>>(url, {
          auth: true,
          cache: 'no-store',
        });
        if (!mounted) return;
        setData(unwrapResponse<T>(response));
      } catch (err: unknown) {
        if (!mounted) return;
        setError(getErrorMessage(err, 'Failed to fetch data'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [url]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
