import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FloatingTabBarProps, FloatingTabRoute } from '@/types/component-types';
import { palette, theme, uiColors } from '@/utils/theme';

const TAB_BAR_HORIZONTAL_INSET = 14;
const TAB_BAR_BOTTOM_GAP = 10;
const TAB_BAR_RADIUS = 999;
const TAB_BAR_MIN_HEIGHT = 64;
const ACTIVE_PILL_RADIUS = 999;
const TAB_ICON_SIZE = 22;
const TAB_LABEL_SIZE = 10;

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  routeIconMap,
}: FloatingTabBarProps) {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const glassBackground = isDark ? 'rgba(18, 24, 34, 0.72)' : 'rgba(255, 255, 255, 0.68)';
  const glassGradient = isDark
    ? ['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.12)'] as const
    : ['rgba(255, 255, 255, 0.86)', 'rgba(255, 247, 232, 0.66)', 'rgba(255, 255, 255, 0.74)'] as const;
  const activePillColor = isDark ? 'rgba(255, 122, 0, 0.18)' : 'rgba(255, 122, 0, 0.12)';
  const inactiveLabelColor = isDark ? palette.dark.mutedText : uiColors.text.subtitleLight;
  const activeLabelColor = theme.colors.primary;
  const inactiveIconColor = isDark ? palette.dark.mutedText : uiColors.text.subtitleLight;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: TAB_BAR_HORIZONTAL_INSET,
        paddingBottom: Math.max(insets.bottom, TAB_BAR_BOTTOM_GAP),
        paddingTop: 8,
        backgroundColor: 'transparent',
        zIndex: 50,
        elevation: 50,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: TAB_BAR_MIN_HEIGHT,
          backgroundColor: glassBackground,
          borderRadius: TAB_BAR_RADIUS,
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.92)',
          shadowColor: uiColors.shadow.base,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.42 : 0.18,
          shadowRadius: 22,
          elevation: 10,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={glassGradient}
          locations={[0, 0.52, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
        {state.routes.map((route: FloatingTabRoute, index: number) => {
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const isFocused = state.index === index;
          const icons = routeIconMap[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 2,
              }}
            >
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 52,
                  minWidth: 74,
                  borderRadius: ACTIVE_PILL_RADIUS,
                  backgroundColor: isFocused ? activePillColor : 'transparent',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  overflow: 'hidden',
                }}
              >
                {icons ? (
                  <Ionicons
                    name={isFocused ? icons.active : icons.inactive}
                    size={TAB_ICON_SIZE}
                    color={isFocused ? activeLabelColor : inactiveIconColor}
                  />
                ) : null}
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: TAB_LABEL_SIZE,
                    fontWeight: isFocused ? '700' : '600',
                    color: isFocused ? activeLabelColor : inactiveLabelColor,
                  }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
