import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AnimatedLogoSplash } from '@/components/common/AnimatedLogoSplash';
import { useAuthContext } from '@/contexts/AuthContext';
import { AppIcon } from '@/icons';
import { JobsNavigator } from '@/navigation/JobsNavigator';
import { ProfileNavigator } from '@/navigation/ProfileNavigator';
import { EarningsScreen } from '@/screens/tabs/EarningsScreen';
import { HomeScreen } from '@/screens/tabs/HomeScreen';
import { AuthStatus } from '@/types/auth-status';
import { MainTabParamList } from '@/types/navigation';
import { MAIN_TAB_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme } from '@/utils/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();
let hasShownMainTabsSplash = false;

export function MainTabsNavigator() {
  const isDark = useColorScheme() === 'dark';
  const [showSplash, setShowSplash] = useState(() => !hasShownMainTabsSplash);
  const { status, locationState } = useAuthContext();
  const { permissionStatus, initializeLocation, requestLocationPermission } = locationState;
  const hasRequestedLocationPermissionRef = useRef(false);

  useEffect(() => {
    if (status !== AuthStatus.AUTHENTICATED) {
      hasRequestedLocationPermissionRef.current = false;
      return;
    }

    if (permissionStatus !== 'undetermined' || hasRequestedLocationPermissionRef.current) {
      return;
    }

    hasRequestedLocationPermissionRef.current = true;
    void (async () => {
      const nextStatus = await requestLocationPermission();
      if (nextStatus === 'granted') {
        await initializeLocation({ forceRefresh: true });
      }
    })();
  }, [initializeLocation, permissionStatus, requestLocationPermission, status]);

  if (showSplash) {
    return (
      <AnimatedLogoSplash
        onAnimationEnd={() => {
          hasShownMainTabsSplash = true;
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? palette.dark.mutedText : palette.light.mutedText,
        tabBarStyle: { backgroundColor: isDark ? palette.dark.card : palette.light.card },
        tabBarIcon: ({ color, size }) => {
          const tabIconMap: Record<keyof MainTabParamList, 'home' | 'jobs' | 'earnings' | 'profile'> = {
            [MAIN_TAB_SCREENS.home]: 'home',
            [MAIN_TAB_SCREENS.jobs]: 'jobs',
            [MAIN_TAB_SCREENS.earnings]: 'earnings',
            [MAIN_TAB_SCREENS.profile]: 'profile',
          };
          const iconName = tabIconMap[route.name as keyof MainTabParamList];
          return <AppIcon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name={MAIN_TAB_SCREENS.home} component={HomeScreen} options={{ title: APP_TEXT.tabs.homeLabel }} />
      <Tab.Screen name={MAIN_TAB_SCREENS.jobs} component={JobsNavigator} options={{ title: APP_TEXT.tabs.jobsLabel }} />
      <Tab.Screen
        name={MAIN_TAB_SCREENS.earnings}
        component={EarningsScreen}
        options={{ title: APP_TEXT.tabs.earningsLabel }}
      />
      <Tab.Screen name={MAIN_TAB_SCREENS.profile} component={ProfileNavigator} options={{ title: APP_TEXT.tabs.profileLabel }} />
    </Tab.Navigator>
  );
}
