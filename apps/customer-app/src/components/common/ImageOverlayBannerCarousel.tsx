import { useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { ImageOverlayBanner } from '@/components/common/ImageOverlayBanner';
import type { AppBannerItem } from '@/types/app-banner';

type ImageOverlayBannerCarouselProps = {
  banners: AppBannerItem[];
  onPressBanner: (banner: AppBannerItem) => void;
  containerClassName?: string;
};

const AUTO_SCROLL_INTERVAL_MS = 5000;

export function ImageOverlayBannerCarousel({
  banners,
  onPressBanner,
  containerClassName = 'mt-4',
}: ImageOverlayBannerCarouselProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const bannerCount = useMemo(() => banners.length, [banners]);

  useEffect(() => {
    if (bannerCount <= 1 || containerWidth <= 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % bannerCount;
        scrollRef.current?.scrollTo({ x: next * containerWidth, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [bannerCount, containerWidth]);

  if (!Array.isArray(banners) || banners.length === 0) {
    return null;
  }

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / containerWidth);
    if (Number.isFinite(nextIndex)) {
      setActiveIndex(Math.max(0, Math.min(nextIndex, bannerCount - 1)));
    }
  };

  return (
    <View
      className={containerClassName}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0 && width !== containerWidth) {
          setContainerWidth(width);
        }
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <View key={banner.id} style={{ width: containerWidth || undefined }}>
            <ImageOverlayBanner
              imageUrl={banner.imageUrl}
              overline={banner.overline ?? undefined}
              title={banner.title ?? ''}
              subtitle={banner.subtitle ?? undefined}
              onPress={() => {
                if (!banner.isClickable) return;
                onPressBanner(banner);
              }}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
