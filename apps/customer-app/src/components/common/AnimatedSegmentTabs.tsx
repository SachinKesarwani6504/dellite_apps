import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, useColorScheme } from 'react-native';

import { palette, theme, uiColors } from '@/utils/theme';

export type SegmentTabItem<T extends string> = {
  label: string;
  value: T;
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

  const activeIndex = useMemo(
    () => Math.max(items.findIndex(item => item.value === value), 0),
    [items, value],
  );

  const tabWidth = layoutWidth > 0 ? layoutWidth / Math.max(items.length, 1) : 0;

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

  return (
    <View
      className="mt-4 rounded-2xl p-1"
      style={{
        backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight90,
        borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        borderWidth: 1,
      }}
      onLayout={event => setLayoutWidth(event.nativeEvent.layout.width)}
    >
      {tabWidth ? (
        <Animated.View
          pointerEvents="none"
          className="absolute left-1 top-1 rounded-xl"
          style={{
            width: tabWidth - 8,
            height: 44,
            transform: [{ translateX }],
            backgroundColor: isDark ? palette.dark.card : '#FFFFFF',
            shadowColor: uiColors.shadow.base,
            shadowOpacity: 0.14,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        />
      ) : null}
      <View className="flex-row">
        {items.map(item => {
          const isActive = item.value === value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              className="flex-1 items-center justify-center rounded-xl"
              style={{ height: 44 }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: isActive ? theme.colors.primary : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight) }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

