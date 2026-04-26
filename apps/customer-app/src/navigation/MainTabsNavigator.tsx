import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';

import { APP_TEXT } from '@/utils/appText';
import { AppIcon } from '@/icons';
import { BookingsNavigator } from '@/navigation/BookingsNavigator';
import { BookingFlowProvider } from '@/contexts/BookingFlowContext';
import { HomeNavigator } from '@/navigation/HomeNavigator';
import { AllServicesNavigator } from '@/navigation/AllServicesNavigator';
import { ProfileNavigator } from '@/navigation/ProfileNavigator';
import type { MainTabsParamList } from '@/types/navigation';
import { MAIN_TAB_SCREEN, palette, theme } from '@/utils';
const Tab = createBottomTabNavigator();

export function MainTabsNavigator() {
  const isDark = useColorScheme() === 'dark';

  return (
    <BookingFlowProvider>
      <Tab.Navigator
        screenOptions={({ route }: { route: { name: keyof MainTabsParamList } }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: isDark ? palette.dark.mutedText : palette.light.mutedText,
          tabBarStyle: { backgroundColor: isDark ? palette.dark.card : palette.light.card },
          tabBarIcon: ({ color, size }: { color: string; size: number }) => {
            const tabIconMap: Record<keyof MainTabsParamList, 'home' | 'allServices' | 'bookings' | 'profile'> = {
              [MAIN_TAB_SCREEN.HOME]: 'home',
              [MAIN_TAB_SCREEN.ALL_SERVICES]: 'allServices',
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
          component={HomeNavigator}
          options={{ title: APP_TEXT.tabs.homeLabel }}
        />
        <Tab.Screen
          name={MAIN_TAB_SCREEN.ALL_SERVICES}
          component={AllServicesNavigator}
          options={{ title: APP_TEXT.tabs.allServicesLabel }}
        />
        <Tab.Screen
          name={MAIN_TAB_SCREEN.BOOKINGS}
          component={BookingsNavigator}
          options={{ title: APP_TEXT.tabs.bookingsLabel }}
        />
        <Tab.Screen
          name={MAIN_TAB_SCREEN.PROFILE}
          component={ProfileNavigator}
          options={{ title: APP_TEXT.tabs.profileLabel }}
        />
      </Tab.Navigator>
    </BookingFlowProvider>
  );
}

