import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FloatingTabBar } from '@/components/common/FloatingTabBar';
import { APP_TEXT } from '@/utils/appText';
import { HomeNavigator } from '@/navigation/HomeNavigator';
import { AllServicesNavigator } from '@/navigation/AllServicesNavigator';
import { ProfileNavigator } from '@/navigation/ProfileNavigator';
import type { FloatingTabBarProps, FloatingTabRouteIcon } from '@/types/component-types';
import type { MainTabsParamList } from '@/types/navigation';
import { MAIN_TAB_SCREEN } from '@/utils';

const Tab = createBottomTabNavigator();

const CUSTOMER_TAB_ICON_MAP: Record<keyof MainTabsParamList, FloatingTabRouteIcon> = {
  [MAIN_TAB_SCREEN.HOME]: { active: 'home', inactive: 'home-outline' },
  [MAIN_TAB_SCREEN.ALL_SERVICES]: { active: 'grid', inactive: 'grid-outline' },
  [MAIN_TAB_SCREEN.PROFILE]: { active: 'person', inactive: 'person-outline' },
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
      tabBar={(props: {
        state: FloatingTabBarProps['state'];
        descriptors: FloatingTabBarProps['descriptors'];
        navigation: FloatingTabBarProps['navigation'];
      }) => (
        <FloatingTabBar
          state={props.state}
          descriptors={props.descriptors}
          navigation={props.navigation}
          routeIconMap={CUSTOMER_TAB_ICON_MAP}
        />
      )}
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
        name={MAIN_TAB_SCREEN.PROFILE}
        component={ProfileNavigator}
        options={{ title: APP_TEXT.tabs.profileLabel }}
      />
    </Tab.Navigator>
  );
}
