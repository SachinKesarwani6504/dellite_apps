import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';

import { APP_TEXT } from '@/constants/appText';
import { AppIcon } from '@/icons';
import { BookingsScreen } from '@/screens/main/BookingsScreen';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { OngoingScreen } from '@/screens/main/OngoingScreen';
import { ProfileNavigator } from '@/navigation/ProfileNavigator';
import type { MainTabsParamList } from '@/types/navigation';
import { MAIN_TAB_SCREEN, palette, theme, uiColors } from '@/utils';
const Tab = createBottomTabNavigator();

export function MainTabsNavigator() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof MainTabsParamList } }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight,
        tabBarStyle: {
          backgroundColor: isDark ? palette.dark.card : palette.light.card,
          borderTopColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          const tabIconMap: Record<keyof MainTabsParamList, 'home' | 'ongoing' | 'bookings' | 'profile'> = {
            [MAIN_TAB_SCREEN.HOME]: 'home',
            [MAIN_TAB_SCREEN.ONGOING]: 'ongoing',
            [MAIN_TAB_SCREEN.BOOKINGS]: 'bookings',
            [MAIN_TAB_SCREEN.PROFILE]: 'profile',
          };
          const iconName = tabIconMap[route.name as keyof MainTabsParamList];
          return <AppIcon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name={MAIN_TAB_SCREEN.HOME}
        component={HomeScreen}
        options={{ title: APP_TEXT.tabs.homeLabel }}
      />
      <Tab.Screen
        name={MAIN_TAB_SCREEN.ONGOING}
        component={OngoingScreen}
        options={{ title: APP_TEXT.tabs.ongoingLabel }}
      />
      <Tab.Screen
        name={MAIN_TAB_SCREEN.BOOKINGS}
        component={BookingsScreen}
        options={{ title: APP_TEXT.tabs.bookingsLabel }}
      />
      <Tab.Screen
        name={MAIN_TAB_SCREEN.PROFILE}
        component={ProfileNavigator}
        options={{ title: APP_TEXT.tabs.profileLabel }}
      />
    </Tab.Navigator>
  );
}
