import { useCallback, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useBookingFlowContext } from '@/contexts/BookingFlowContext';
import { getCurrentLocationDetails } from '@/modules/location/services/location.service';
import type { LocationCoordinates } from '@/modules/location/types/location.types';
import type {
  BookingLocationPickerScreenControllerArgs,
  BookingLocationPickerScreenControllerValue,
} from '@/types/main-screens';
import { APP_TEXT } from '@/utils/appText';
import {
  buildAddressSummary,
  buildDetectedAddressDraft,
  buildLocationPrimaryLine,
  createFallbackLocationCoordinates,
  getErrorMessage,
  getAddressDraftCoordinates,
  isBookingAddressComplete,
} from '@/utils';

export function useBookingLocationPickerScreenController(
  args: BookingLocationPickerScreenControllerArgs,
): BookingLocationPickerScreenControllerValue {
  const isDark = useColorScheme() === 'dark';
  const { onSelectLocation } = args;
  const { address, setBookingAddress } = useBookingFlowContext();
  const initialCoordinates = getAddressDraftCoordinates(address) ?? createFallbackLocationCoordinates();
  const [coordinates, setCoordinates] = useState<LocationCoordinates>(initialCoordinates);
  const [selectedAddressDraft, setSelectedAddressDraft] = useState(address);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const selectedLocationSummary = buildAddressSummary(selectedAddressDraft) || APP_TEXT.main.bookingFlow.pinLocationEmptyHint;
  const selectedLocationPrimaryLine = buildLocationPrimaryLine(selectedAddressDraft) || APP_TEXT.main.bookingFlow.pinLocationFallbackTitle;
  const canSelectLocation = isBookingAddressComplete(selectedAddressDraft) && !isResolving;

  const resolvePinnedLocation = useCallback(async (nextCoordinates: LocationCoordinates) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setCoordinates(nextCoordinates);
    setSelectedAddressDraft(current => ({
      ...current,
      mode: 'pin',
      latitude: nextCoordinates.latitude,
      longitude: nextCoordinates.longitude,
    }));
    setIsResolving(true);
    setError(null);
    console.log('[booking-location] picker:selected-coordinates', nextCoordinates);

    try {
      const pinnedLocation = await getCurrentLocationDetails(nextCoordinates);
      if (requestRef.current !== requestId) {
        return;
      }

      const nextAddressDraft = {
        ...buildDetectedAddressDraft(pinnedLocation),
        mode: 'pin' as const,
      };
      console.log('[booking-location] picker:resolved', {
        sourceLocation: pinnedLocation,
        storedAddressDraft: nextAddressDraft,
      });
      setSelectedAddressDraft(nextAddressDraft);
    } catch (resolveError) {
      if (requestRef.current !== requestId) {
        return;
      }

      setError(getErrorMessage(resolveError, APP_TEXT.main.bookingFlow.pinLocationResolveError));
    } finally {
      if (requestRef.current === requestId) {
        setIsResolving(false);
      }
    }
  }, []);

  const selectLocation = useCallback(() => {
    if (!canSelectLocation) return;
    const nextAddressDraft = {
      ...selectedAddressDraft,
      mode: 'pin' as const,
    };
    console.log('[booking-location] picker:selected-address', nextAddressDraft);
    setBookingAddress(nextAddressDraft);
    onSelectLocation();
  }, [canSelectLocation, onSelectLocation, selectedAddressDraft, setBookingAddress]);

  return {
    isDark,
    coordinates,
    selectedLocationSummary,
    selectedLocationPrimaryLine,
    isResolving,
    error,
    canSelectLocation,
    resolvePinnedLocation,
    selectLocation,
  };
}
