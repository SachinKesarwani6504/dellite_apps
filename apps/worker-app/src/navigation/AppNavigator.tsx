import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef } from 'react';
import { AppState, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { flushPendingNavigation, navigationRef } from '@/navigation/navigationRef';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { JobDetailsNavigator } from '@/navigation/JobDetailsNavigator';
import { MainTabsNavigator } from '@/navigation/MainTabsNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { ProfileDetailsNavigator } from '@/navigation/ProfileDetailsNavigator';
import { OfflineScreen } from '@/screens/OfflineScreen';
import { AuthStatus } from '@/types/auth-status';
import { RootStackParamList } from '@/types/navigation';
import { ROOT_SCREENS } from '@/types/screen-names';
import { palette, theme } from '@/utils/theme';
import { useBadgeSync } from '@/hooks/useBadgeSync';
import { useLiveNotifications } from '@/hooks/useLiveNotifications';
import { useUserPresence } from '@/hooks/useUserPresence';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const ROOT_NAVIGATOR_BRANCH = {
  bootstrap: 'bootstrap',
  offline: 'offline',
  auth: 'auth',
  onboarding: 'onboarding',
  main: 'main',
} as const;

function BootstrapScreenFallback() {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? palette.dark.background : palette.light.background }}>
      <LoadingState containerClassName="flex-1 w-full" minHeight={0} />
    </View>
  );
}

function resolveRootNavigatorBranch(
  status: AuthStatus,
  onboardingLoading: boolean,
  isOnboardingActive: boolean,
  networkInitialized: boolean,
  isOffline: boolean,
) {
  if (networkInitialized && isOffline) {
    return ROOT_NAVIGATOR_BRANCH.offline;
  }

  if (
    status === AuthStatus.BOOTSTRAPPING
    || (onboardingLoading && status !== AuthStatus.LOGGED_OUT && status !== AuthStatus.OTP_SENT)
  ) {
    return ROOT_NAVIGATOR_BRANCH.bootstrap;
  }

  if (status === AuthStatus.LOGGED_OUT || status === AuthStatus.OTP_SENT) {
    return ROOT_NAVIGATOR_BRANCH.auth;
  }

  if (
    status === AuthStatus.ONBOARDING
    || status === AuthStatus.PHONE_VERIFIED
    || (status === AuthStatus.AUTHENTICATED && isOnboardingActive)
  ) {
    return ROOT_NAVIGATOR_BRANCH.onboarding;
  }

  return ROOT_NAVIGATOR_BRANCH.main;
}

export function AppNavigator() {
  const { status, user, locationState } = useAuthContext();
  const { initializeLocation } = locationState;
  const { isOnboardingActive, loading: onboardingLoading } = useOnboardingContext();
  const { isOffline, initialized, refresh } = useNetworkStatus();
  const wasOfflineRef = useRef(false);
  const hasInitializedLocationRef = useRef(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const userId = user?.id ?? null;
  const shouldTrackUserSession = status === AuthStatus.AUTHENTICATED && Boolean(userId);
  const rootBranch = resolveRootNavigatorBranch(
    status,
    onboardingLoading,
    isOnboardingActive,
    initialized,
    isOffline,
  );

  useUserPresence({
    userId,
    enabled: shouldTrackUserSession,
  });

  useLiveNotifications({
    userId,
    enabled: shouldTrackUserSession,
  });

  useBadgeSync(shouldTrackUserSession, status === AuthStatus.LOGGED_OUT);

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: isDark ? palette.dark.background : palette.light.background,
        card: isDark ? palette.dark.card : palette.light.card,
        text: isDark ? palette.dark.text : palette.light.text,
        border: isDark ? palette.dark.border : palette.light.border,
        primary: theme.colors.primary,
      },
    }),
    [isDark],
  );

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

  useEffect(() => {
    flushPendingNavigation();
  }, [rootBranch]);

  if (rootBranch === ROOT_NAVIGATOR_BRANCH.offline) {
    return <OfflineScreen onRetry={refresh} />;
  }

  if (rootBranch === ROOT_NAVIGATOR_BRANCH.bootstrap) {
    return <BootstrapScreenFallback />;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation} theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {rootBranch === ROOT_NAVIGATOR_BRANCH.auth ? (
          <RootStack.Screen name={ROOT_SCREENS.authNavigator} component={AuthNavigator} />
        ) : rootBranch === ROOT_NAVIGATOR_BRANCH.onboarding ? (
          <RootStack.Screen name={ROOT_SCREENS.onboardingNavigator} component={OnboardingNavigator} />
        ) : (
          <>
            <RootStack.Screen name={ROOT_SCREENS.mainTabsNavigator} component={MainTabsNavigator} />
            <RootStack.Screen name={ROOT_SCREENS.jobDetailsNavigator} component={JobDetailsNavigator} />
            <RootStack.Screen name={ROOT_SCREENS.profileDetailsNavigator} component={ProfileDetailsNavigator} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
