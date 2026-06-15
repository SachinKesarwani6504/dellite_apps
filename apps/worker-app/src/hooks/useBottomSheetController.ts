import { useCallback, useMemo, useState } from 'react';

import type {
  ActionListBottomSheetConfig,
  AppBottomSheetConfig,
  BottomSheetAction,
  BottomSheetContextValue,
  ConfirmBottomSheetConfig,
  CustomBottomSheetConfig,
  InfoBottomSheetConfig,
} from '@/types/bottom-sheet';

export function useBottomSheetController(): BottomSheetContextValue {
  const [activeSheet, setActiveSheet] = useState<AppBottomSheetConfig | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const closeSheet = useCallback(() => {
    setPendingActionId(null);
    setActiveSheet(null);
  }, []);

  const showBottomSheet = useCallback((config: AppBottomSheetConfig) => {
    setPendingActionId(null);
    setActiveSheet(config);
  }, []);

  const showInfoSheet = useCallback((config: Omit<InfoBottomSheetConfig, 'variant'>) => {
    showBottomSheet({ ...config, variant: 'info' });
  }, [showBottomSheet]);

  const showConfirmSheet = useCallback((config: Omit<ConfirmBottomSheetConfig, 'variant'>) => {
    showBottomSheet({ ...config, variant: 'confirm' });
  }, [showBottomSheet]);

  const showActionListSheet = useCallback((config: Omit<ActionListBottomSheetConfig, 'variant'>) => {
    showBottomSheet({ ...config, variant: 'action-list' });
  }, [showBottomSheet]);

  const showCustomSheet = useCallback((config: Omit<CustomBottomSheetConfig, 'variant'>) => {
    showBottomSheet({ ...config, variant: 'custom' });
  }, [showBottomSheet]);

  const runAction = useCallback(async (action?: BottomSheetAction) => {
    if (!action || action.disabled || pendingActionId) {
      return;
    }

    const shouldClose = action.closeOnPress ?? true;
    if (shouldClose) {
      closeSheet();
    } else {
      setPendingActionId(action.id);
    }

    try {
      await action.onPress?.();
      if (!shouldClose && (action.closeOnSuccess ?? true)) {
        closeSheet();
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[bottom-sheet] action failed', { actionId: action.id, error });
      }
    } finally {
      if (!shouldClose) {
        setPendingActionId(currentActionId => (currentActionId === action.id ? null : currentActionId));
      }
    }
  }, [closeSheet, pendingActionId]);

  return useMemo(() => ({
    activeSheet,
    isVisible: activeSheet !== null,
    pendingActionId,
    closeSheet,
    showBottomSheet,
    showInfoSheet,
    showConfirmSheet,
    showActionListSheet,
    showCustomSheet,
    runAction,
  }), [
    activeSheet,
    closeSheet,
    pendingActionId,
    runAction,
    showActionListSheet,
    showBottomSheet,
    showConfirmSheet,
    showCustomSheet,
    showInfoSheet,
  ]);
}
