import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

import type { HomeLocationPermissionPromptParams } from '@/modules/location/types/location.types';

export function useHomeLocationPermissionPrompt({
  permissionStatus,
  requestLocationPermission,
  initializeLocation,
}: HomeLocationPermissionPromptParams) {
  const hasAutoRequestedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (permissionStatus !== 'undetermined' || hasAutoRequestedRef.current) {
        return;
      }

      hasAutoRequestedRef.current = true;
      void (async () => {
        try {
          const status = await requestLocationPermission();
          if (status === 'granted') {
            await initializeLocation({ forceRefresh: true });
          }
        } catch {
          // Permission failures are surfaced through location state.
        }
      })();
    }, [initializeLocation, permissionStatus, requestLocationPermission]),
  );
}
