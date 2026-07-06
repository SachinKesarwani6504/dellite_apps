import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FloatingTabBar } from '@/components/common/FloatingTabBar';
import { ProfileNavigator } from '@/navigation/ProfileNavigator';
import { EarningsNavigator } from '@/navigation/EarningsNavigator';
import { HomeScreen } from '@/screens/tabs/HomeScreen';
import type { FloatingTabBarProps, FloatingTabRouteIcon } from '@/types/component-types';
import { MainTabParamList } from '@/types/navigation';
import { MAIN_TAB_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';

const Tab = createBottomTabNavigator<MainTabParamList>();

const WORKER_TAB_ICON_MAP: Record<keyof MainTabParamList, FloatingTabRouteIcon> = {
  [MAIN_TAB_SCREENS.home]: { active: 'home', inactive: 'home-outline' },
  [MAIN_TAB_SCREENS.earnings]: { active: 'wallet', inactive: 'wallet-outline' },
  [MAIN_TAB_SCREENS.profile]: { active: 'person', inactive: 'person-outline' },
};

export function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          height: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        sceneStyle: {
          backgroundColor: 'transparent',
        },
      }}
      tabBar={(props: BottomTabBarProps) => (
        <FloatingTabBar
          state={props.state}
          descriptors={props.descriptors}
          navigation={props.navigation as FloatingTabBarProps['navigation']}
          routeIconMap={WORKER_TAB_ICON_MAP}
        />
      )}
    >
      <Tab.Screen name={MAIN_TAB_SCREENS.home} component={HomeScreen} options={{ title: APP_TEXT.tabs.homeLabel }} />
      <Tab.Screen
        name={MAIN_TAB_SCREENS.earnings}
        component={EarningsNavigator}
        options={{ title: APP_TEXT.tabs.earningsLabel }}
      />
      <Tab.Screen name={MAIN_TAB_SCREENS.profile} component={ProfileNavigator} options={{ title: APP_TEXT.tabs.profileLabel }} />
    </Tab.Navigator>
  );
}
