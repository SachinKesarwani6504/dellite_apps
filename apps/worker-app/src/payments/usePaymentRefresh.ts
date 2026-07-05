import { useCallback } from 'react';

export function usePaymentRefresh<T>(
  fetchFn: () => Promise<T>,
  isDone: (data: T) => boolean,
) {
  return useCallback(async (): Promise<'done' | 'processing' | 'timeout'> => {
    const maxAttempts = 10;
    for (let index = 0; index < maxAttempts; index += 1) {
      await new Promise(resolve => {
        setTimeout(resolve, 3000);
      });
      const data = await fetchFn();
      if (isDone(data)) return 'done';
    }
    return 'timeout';
  }, [fetchFn, isDone]);
}
