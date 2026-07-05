import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/actions/http/httpClient';
import { ApiError, type ApiEnvelope } from '@/types/api';

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
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!url.trim()) {
      setData(null);
      setError('Invalid URL');
      setStatusCode(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setStatusCode(null);

    try {
      const response = await apiGet<T | ApiEnvelope<T>>(url, {
        auth: true,
        cache: 'no-store',
      });
      setData(unwrapResponse<T>(response));
    } catch (err: unknown) {
      setData(null);
      setStatusCode(err instanceof ApiError ? err.statusCode : null);
      const message = err instanceof Error && err.message.trim() ? err.message : 'Failed to fetch data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      setStatusCode(null);
      try {
        const response = await apiGet<T | ApiEnvelope<T>>(url, {
          auth: true,
          cache: 'no-store',
        });
        if (!mounted) return;
        setData(unwrapResponse<T>(response));
      } catch (err: unknown) {
        if (!mounted) return;
        setData(null);
        setStatusCode(err instanceof ApiError ? err.statusCode : null);
        const message = err instanceof Error && err.message.trim() ? err.message : 'Failed to fetch data';
        setError(message);
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
    statusCode,
    isNotFound: statusCode === 404,
    refetch: fetchData,
  };
}
