import type { ImageSourcePropType, ImageURISource } from 'react-native';
import type { ImageCacheMode } from '@/types/shared';

export function withDefaultImageCache(
  source: ImageSourcePropType | undefined,
  cacheMode: ImageCacheMode,
): ImageSourcePropType | undefined {
  if (!source) return source;
  if (typeof source === 'number') return source;

  if (Array.isArray(source)) {
    return source.map(item => withDefaultImageCache(item, cacheMode) as ImageURISource) as unknown as ImageSourcePropType;
  }

  const uriSource = source as ImageURISource;
  if (typeof uriSource.uri === 'string' && uriSource.uri.trim().length > 0) {
    return { ...uriSource, cache: uriSource.cache ?? cacheMode };
  }
  return source;
}
