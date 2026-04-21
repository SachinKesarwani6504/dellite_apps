import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';

import { AnimatedLogoSplash } from '@/components/common/AnimatedLogoSplash';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainTabsNavigator } from '@/navigation/MainTabsNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { AUTH_STATUS } from '@/types/auth';
import { palette, ROOT_SCREEN, theme, uiColors } from '@/utils';

const RootStack = createNativeStackNavigator();

export function AppNavigator() {
  const { authState } = useAuthContext();
  const { isOnboardingActive, loading: onboardingLoading } = useOnboardingContext();
  const isDark = useColorScheme() === 'dark';
  const needsOnboardingSnapshot =
    (authState.status === AUTH_STATUS.ONBOARDING || authState.status === AUTH_STATUS.POST_ONBOARDING_WELCOME)
    && Boolean(authState.tokens?.accessToken)
    && !authState.user;

  if (
    authState.status === AUTH_STATUS.BOOTSTRAPPING
    || needsOnboardingSnapshot
    || (
      onboardingLoading
      && authState.status !== AUTH_STATUS.LOGGED_OUT
      && authState.status !== AUTH_STATUS.OTP_SENT
    )
  ) {
    return <AnimatedLogoSplash />;
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
    <NavigationContainer theme={navigationTheme}>
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
          <RootStack.Screen name={ROOT_SCREEN.MAIN_TABS_NAVIGATOR} component={MainTabsNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
