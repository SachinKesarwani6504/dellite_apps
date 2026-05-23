import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

import { palette, theme, uiColors } from '@/utils/theme';

export type SegmentTabItem<T extends string> = {
  label: string;
  value: T;
  count?: number;
};

type AnimatedSegmentTabsProps<T extends string> = {
  items: SegmentTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
};

export function AnimatedSegmentTabs<T extends string>({ items, value, onChange }: AnimatedSegmentTabsProps<T>) {
  const isDark = useColorScheme() === 'dark';
  const [layoutWidth, setLayoutWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const MIN_TAB_WIDTH = 116;
  const INNER_HORIZONTAL_PADDING = 6;
  const TAB_HEIGHT = 42;

  const activeIndex = useMemo(
    () => Math.max(items.findIndex(item => item.value === value), 0),
    [items, value],
  );

  const tabWidth = layoutWidth > 0
    ? Math.max(layoutWidth / Math.max(items.length, 1), MIN_TAB_WIDTH)
    : MIN_TAB_WIDTH;
  const totalTabsWidth = tabWidth * Math.max(items.length, 1);
  const isScrollable = totalTabsWidth > layoutWidth;

  useEffect(() => {
    if (!tabWidth) return;
    Animated.spring(translateX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.7,
    }).start();
  }, [activeIndex, tabWidth, translateX]);

  useEffect(() => {
    if (!isScrollable || layoutWidth <= 0) return;
    const centeredOffset = Math.max(0, (activeIndex * tabWidth) - ((layoutWidth - tabWidth) / 2));
    const maxOffset = Math.max(0, totalTabsWidth - layoutWidth);
    scrollRef.current?.scrollTo({ x: Math.min(centeredOffset, maxOffset), animated: true });
  }, [activeIndex, isScrollable, layoutWidth, tabWidth, totalTabsWidth]);

  return (
    <View
      className="mt-4 rounded-full p-1.5"
      style={{
        backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        borderWidth: 1,
        overflow: 'hidden',
      }}
      onLayout={event => setLayoutWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        style={{ overflow: 'hidden' }}
        contentContainerStyle={{ paddingHorizontal: INNER_HORIZONTAL_PADDING }}
      >
        <View style={{ width: totalTabsWidth, minHeight: TAB_HEIGHT, position: 'relative' }}>
          <Animated.View
            pointerEvents="none"
            className="absolute top-0 rounded-full"
            style={{
              left: INNER_HORIZONTAL_PADDING,
              width: tabWidth - (INNER_HORIZONTAL_PADDING * 2),
              height: TAB_HEIGHT,
              transform: [{ translateX }],
              backgroundColor: theme.colors.primary,
              shadowColor: uiColors.shadow.base,
              shadowOpacity: 0.18,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 2,
            }}
          />
          <View className="flex-row">
            {items.map(item => {
              const isActive = item.value === value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => onChange(item.value)}
                  className="flex-row items-center justify-center px-1.5"
                  style={{ width: tabWidth, height: TAB_HEIGHT }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: isActive ? theme.colors.onPrimary : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight) }}
                  >
                    {item.label}
                  </Text>
                  {typeof item.count === 'number' ? (
                    <View
                      className="ml-1.5 rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: isActive
                          ? uiColors.surface.overlayLight95
                          : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight),
                      }}
                    >
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color: isActive ? theme.colors.primary : (isDark ? palette.dark.text : theme.colors.baseDark) }}
                      >
                        {item.count}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
