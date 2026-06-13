import React, { createContext, useContext } from 'react';

import { useBottomSheetController } from '@/hooks/useBottomSheetController';
import type { BottomSheetContextValue } from '@/types/bottom-sheet';

const BottomSheetContext = createContext<BottomSheetContextValue | undefined>(undefined);

export function BottomSheetProvider({ children }: { children: React.ReactNode }) {
  const value = useBottomSheetController();

  return <BottomSheetContext.Provider value={value}>{children}</BottomSheetContext.Provider>;
}

export function useBottomSheetContext() {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheetContext must be used inside BottomSheetProvider');
  }
  return context;
}
