import { forwardRef, useMemo, useState } from 'react';
import { Image } from 'react-native';
import type { AppImageProps, AppImageRef } from '@/types/component-types';
import { withDefaultImageCache } from '@/utils/image-cache';

const DEFAULT_FALLBACK_IMAGE = require('@/assets/images/webp/dummy_image.webp');

export const AppImage = forwardRef<AppImageRef, AppImageProps>(function AppImage(
  { source, cacheMode = 'force-cache', onError, ...props },
  ref,
) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const effectiveSource = hasLoadError || !source ? DEFAULT_FALLBACK_IMAGE : source;
  const resolvedSource = useMemo(
    () => withDefaultImageCache(effectiveSource, cacheMode),
    [cacheMode, effectiveSource],
  );

  return (
    <Image
      ref={ref}
      source={resolvedSource}
      onError={(event) => {
        if (!hasLoadError) {
          setHasLoadError(true);
        }
        onError?.(event);
      }}
      {...props}
    />
  );
});
