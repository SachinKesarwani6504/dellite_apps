import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_CACHE_KEY } from '@/modules/location/constants/location.constants';
import { mapToNormalizedLocation } from '@/modules/location/utils/location.mapper';
import { LocationCachePayload } from '@/modules/location/types/location.types';

export async function readLocationCache(): Promise<LocationCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { location?: unknown; lastUpdatedAt?: unknown };
    const normalizedLocation = mapToNormalizedLocation(parsed.location);
    if (!normalizedLocation) {
      await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }

    return {
      location: normalizedLocation,
      lastUpdatedAt: typeof parsed.lastUpdatedAt === 'string' ? parsed.lastUpdatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function writeLocationCache(payload: LocationCachePayload) {
  await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
}

export async function clearLocationCache() {
  await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
}
