import React, { createContext, useContext } from 'react';
import { useLocationController } from '@/hooks/useLocationController';
import type { LocationContextValue } from '@/modules/location/types/location.types';

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const value = useLocationController();

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used inside LocationProvider');
  }
  return context;
}
