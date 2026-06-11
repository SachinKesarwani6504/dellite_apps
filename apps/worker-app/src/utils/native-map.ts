import { Platform } from 'react-native';
import { PROVIDER_GOOGLE } from 'react-native-maps';
import { ENV } from '@/utils/env';

export function getNativeMapProvider() {
  return Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
}

export function canRenderNativeMap() {
  return Platform.OS !== 'android' || Boolean(ENV.GOOGLE_MAPS_API_KEY);
}
