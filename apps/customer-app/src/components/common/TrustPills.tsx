import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { palette, theme, uiColors } from '@/utils';

export type TrustPillItem = {
  id: string;
  label: string;
  icon: 'shield-checkmark-outline' | 'star-outline' | 'time-outline' | 'home-outline';
};

type Props = {
  items: TrustPillItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function TrustPills({ items, activeId, onSelect }: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="w-full flex-row flex-wrap items-center justify-center" style={{ gap: 8 }}>
      {items.map((item) => {
        const isActive = activeId === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            className="flex-row items-center rounded-full border px-3 py-2"
            style={{
              borderColor: isActive
                ? theme.colors.primary
                : isDark
                  ? uiColors.surface.overlayDark14
                  : palette.light.border,
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight90,
              shadowColor: isActive ? uiColors.shadow.focus : uiColors.shadow.base,
              shadowOpacity: isActive ? 0.3 : 0,
              shadowRadius: isActive ? 10 : 0,
              shadowOffset: { width: 0, height: 0 },
              elevation: isActive ? 4 : 0,
            }}
          >
            <Ionicons
              name={item.icon}
              size={13}
              color={isActive ? theme.colors.primary : isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight}
            />
            <Text
              className="ml-2 text-xs font-semibold"
              style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
