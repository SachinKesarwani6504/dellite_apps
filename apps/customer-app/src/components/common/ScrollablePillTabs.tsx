import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import type { ScrollablePillTabsProps } from '@/types/component-types';
import { palette, theme, uiColors } from '@/utils/theme';

export function ScrollablePillTabs<T extends string>({
  items,
  value,
  onChange,
}: ScrollablePillTabsProps<T>) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="mt-4 rounded-2xl p-1.5"
      style={{
        backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight90,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 4 }}
      >
        {items.map(item => {
          const selected = item.value === value;
          const contentColor = selected
            ? theme.colors.onPrimary
            : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight);

          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              className="min-h-11 flex-row items-center rounded-xl border px-3.5 py-2.5"
              style={{
                backgroundColor: selected ? theme.colors.primary : (isDark ? palette.dark.card : palette.light.card),
                borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight),
                shadowColor: selected ? uiColors.shadow.cta : 'transparent',
                shadowOpacity: selected ? 0.18 : 0,
                shadowRadius: selected ? 8 : 0,
                shadowOffset: { width: 0, height: 3 },
                elevation: selected ? 3 : 0,
              }}
            >
              {item.iconName ? (
                <Ionicons name={item.iconName} size={16} color={contentColor} />
              ) : null}
              <Text
                className={item.iconName ? 'ml-2 text-sm font-extrabold' : 'text-sm font-extrabold'}
                style={{ color: contentColor }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
