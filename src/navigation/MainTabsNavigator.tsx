import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { AppIcon } from '@/icons';
import { ProfileNavigator } from '@/navigation/ProfileNavigator';
import { EarningsScreen } from '@/screens/tabs/EarningsScreen';
import { HomeScreen } from '@/screens/tabs/HomeScreen';
import { OngoingScreen } from '@/screens/tabs/OngoingScreen';
import { MainTabParamList } from '@/types/navigation';
import { MAIN_TAB_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme } from '@/utils/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabsNavigator() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? palette.dark.mutedText : palette.light.mutedText,
        tabBarStyle: { backgroundColor: isDark ? palette.dark.card : palette.light.card },
        tabBarIcon: ({ color, size }) => {
          const tabIconMap: Record<keyof MainTabParamList, 'home' | 'ongoing' | 'earnings' | 'profile'> = {
            [MAIN_TAB_SCREENS.home]: 'home',
            [MAIN_TAB_SCREENS.ongoing]: 'ongoing',
            [MAIN_TAB_SCREENS.earnings]: 'earnings',
            [MAIN_TAB_SCREENS.profile]: 'profile',
          };
          const iconName = tabIconMap[route.name as keyof MainTabParamList];
          return <AppIcon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name={MAIN_TAB_SCREENS.home} component={HomeScreen} options={{ title: APP_TEXT.tabs.homeLabel }} />
      <Tab.Screen name={MAIN_TAB_SCREENS.ongoing} component={OngoingScreen} options={{ title: APP_TEXT.tabs.ongoingLabel }} />
      <Tab.Screen
        name={MAIN_TAB_SCREENS.earnings}
        component={EarningsScreen}
        options={{ title: APP_TEXT.tabs.earningsLabel }}
      />
      <Tab.Screen name={MAIN_TAB_SCREENS.profile} component={ProfileNavigator} options={{ title: APP_TEXT.tabs.profileLabel }} />
    </Tab.Navigator>
  );
}
