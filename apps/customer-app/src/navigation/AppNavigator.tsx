import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { BookingFlowProvider } from '@/contexts/BookingFlowContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { BookingDetailsNavigator } from '@/navigation/BookingDetailsNavigator';
import { BookingFlowNavigator } from '@/navigation/BookingFlowNavigator';
import { flushPendingNavigation, navigationRef } from '@/navigation/navigationRef';
import { MainTabsNavigator } from '@/navigation/MainTabsNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { OfflineScreen } from '@/screens/OfflineScreen';
import { AUTH_STATUS } from '@/types/auth';
import { palette, ROOT_SCREEN, theme, uiColors } from '@/utils';
import { useLiveNotifications } from '@/hooks/useLiveNotifications';
import { useUserPresence } from '@/hooks/useUserPresence';

const RootStack = createNativeStackNavigator();

export function AppNavigator() {
  const { authState, locationState } = useAuthContext();
  const { initializeLocation } = locationState;
  const { isOnboardingActive } = useOnboardingContext();
  const { isOffline, initialized, refresh } = useNetworkStatus();
  const wasOfflineRef = useRef(false);
  const hasInitializedLocationRef = useRef(false);
  const isDark = useColorScheme() === 'dark';
  const userId = authState.user?.id ?? null;
  const hasAccessToken = Boolean(authState.tokens?.accessToken);
  const shouldTrackUserSession = hasAccessToken && Boolean(userId);
  const needsOnboardingSnapshot =
    (authState.status === AUTH_STATUS.ONBOARDING || authState.status === AUTH_STATUS.POST_ONBOARDING_WELCOME)
    && Boolean(authState.tokens?.accessToken)
    && !authState.user;

  useUserPresence({
    userId,
    enabled: shouldTrackUserSession,
  });

  useLiveNotifications({
    userId,
    enabled: shouldTrackUserSession,
  });

  useEffect(() => {
    if (authState.status === AUTH_STATUS.BOOTSTRAPPING || needsOnboardingSnapshot) {
      return;
    }
    void SplashScreen.hideAsync().catch(() => {
      // No-op if already hidden.
    });
  }, [authState.status, needsOnboardingSnapshot]);

  useEffect(() => {
    if (!hasInitializedLocationRef.current) {
      hasInitializedLocationRef.current = true;
      void initializeLocation();
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      void initializeLocation({ forceRefresh: true });
    });

    return () => {
      subscription.remove();
    };
  }, [initializeLocation]);

  useEffect(() => {
    if (!initialized) return;
    if (isOffline) {
      wasOfflineRef.current = true;
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      void initializeLocation({ forceRefresh: true });
    }
  }, [initializeLocation, initialized, isOffline]);

  if (
    authState.status === AUTH_STATUS.BOOTSTRAPPING
    || needsOnboardingSnapshot
  ) {
    return <View style={{ flex: 1, backgroundColor: isDark ? palette.dark.background : palette.light.background }} />;
  }

  if (initialized && isOffline) {
    return <OfflineScreen onRetry={refresh} />;
  }

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    dark: isDark,
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: isDark ? palette.dark.background : palette.light.background,
      card: isDark ? palette.dark.card : palette.light.card,
      text: isDark ? palette.dark.text : palette.light.text,
      border: isDark ? uiColors.surface.overlayDark14 : palette.light.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation} theme={navigationTheme}>
      <BookingFlowProvider>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {authState.status === AUTH_STATUS.LOGGED_OUT || authState.status === AUTH_STATUS.OTP_SENT ? (
            <RootStack.Screen
              key={authState.status}
              name={ROOT_SCREEN.AUTH_NAVIGATOR}
              component={AuthNavigator}
            />
          ) : authState.status === AUTH_STATUS.ONBOARDING
            || authState.status === AUTH_STATUS.POST_ONBOARDING_WELCOME
            || (authState.status === AUTH_STATUS.AUTHENTICATED && isOnboardingActive) ? (
            <RootStack.Screen
              key="onboarding"
              name={ROOT_SCREEN.ONBOARDING_NAVIGATOR}
              component={OnboardingNavigator}
            />
          ) : (
            <>
              <RootStack.Screen name={ROOT_SCREEN.MAIN_TABS_NAVIGATOR} component={MainTabsNavigator} />
              <RootStack.Screen name={ROOT_SCREEN.BOOKING_FLOW_NAVIGATOR} component={BookingFlowNavigator} />
              <RootStack.Screen name={ROOT_SCREEN.BOOKING_DETAILS_NAVIGATOR} component={BookingDetailsNavigator} />
            </>
          )}
        </RootStack.Navigator>
      </BookingFlowProvider>
    </NavigationContainer>
  );
}
