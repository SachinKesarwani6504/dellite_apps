import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { TwoOptionPillTabsProps } from '@/types/component-types';
import { theme, uiColors } from '@/utils/theme';

export function TwoOptionPillTabs<T extends string>({
  items,
  value,
  onChange,
  isDark,
}: TwoOptionPillTabsProps<T>) {
  return (
    <View
      className="flex-row rounded-full p-1.5"
      style={{ backgroundColor: isDark ? uiColors.surface.overlayDark95 : uiColors.surface.overlayLight95 }}
    >
      {items.map((item) => {
        const selected = item.value === value;
        const contentColor = selected ? '#FFFFFF' : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight);

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            className="h-12 flex-1 flex-row items-center justify-center rounded-full"
            style={{
              backgroundColor: selected ? theme.colors.primary : 'transparent',
              shadowColor: selected ? uiColors.shadow.base : 'transparent',
              shadowOpacity: selected ? 0.26 : 0,
              shadowRadius: selected ? 12 : 0,
              shadowOffset: { width: 0, height: 7 },
              elevation: selected ? 5 : 0,
            }}
          >
            <Ionicons name={item.iconName} size={20} color={contentColor} />
            <Text className="ml-2 text-base font-extrabold" style={{ color: contentColor }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
