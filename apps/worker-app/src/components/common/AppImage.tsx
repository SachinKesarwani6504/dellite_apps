import { forwardRef, useMemo } from 'react';
import type { ImageSourcePropType, ImageURISource } from 'react-native';
import { Image } from 'react-native';

type CacheMode = ImageURISource['cache'];

type AppImageProps = Omit<React.ComponentProps<typeof Image>, 'source'> & {
  source?: ImageSourcePropType;
  cacheMode?: CacheMode;
};

function withDefaultCache(source: ImageSourcePropType | undefined, cacheMode: CacheMode): ImageSourcePropType | undefined {
  if (!source) return source;
  if (typeof source === 'number') return source;

  if (Array.isArray(source)) {
    return source.map(item => withDefaultCache(item, cacheMode) as ImageURISource) as unknown as ImageSourcePropType;
  }

  const uriSource = source as ImageURISource;
  if (typeof uriSource.uri === 'string' && uriSource.uri.trim().length > 0) {
    return { ...uriSource, cache: uriSource.cache ?? cacheMode };
  }
  return source;
}

export const AppImage = forwardRef<React.ElementRef<typeof Image>, AppImageProps>(function AppImage(
  { source, cacheMode = 'force-cache', ...props },
  ref,
) {
  const resolvedSource = useMemo(
    () => withDefaultCache(source, cacheMode),
    [cacheMode, source],
  );

  return <Image ref={ref} source={resolvedSource} {...props} />;
});

