import { forwardRef, useMemo } from 'react';
import type { ImageSourcePropType, ImageURISource } from 'react-native';
import { ImageBackground } from 'react-native';

type CacheMode = ImageURISource['cache'];

type AppImageBackgroundProps = Omit<React.ComponentProps<typeof ImageBackground>, 'source'> & {
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

export const AppImageBackground = forwardRef<React.ElementRef<typeof ImageBackground>, AppImageBackgroundProps>(function AppImageBackground(
  { source, cacheMode = 'force-cache', ...props },
  ref,
) {
  const resolvedSource = useMemo(
    () => withDefaultCache(source, cacheMode),
    [cacheMode, source],
  );

  return <ImageBackground ref={ref} source={resolvedSource} {...props} />;
});

