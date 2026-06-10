import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { clearAppBadgeCount, syncAppBadgeCountFromBackend } from '@/utils/appBadge';

export function useBadgeSync(enabled: boolean, clearWhenDisabled = false) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (enabled) {
      void syncAppBadgeCountFromBackend(true);
      return;
    }

    if (clearWhenDisabled) {
      void clearAppBadgeCount();
    }
  }, [clearWhenDisabled, enabled]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if ((previousState === 'background' || previousState === 'inactive') && nextState === 'active') {
        void syncAppBadgeCountFromBackend();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);
}
