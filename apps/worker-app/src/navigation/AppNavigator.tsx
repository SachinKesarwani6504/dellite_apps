import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AnimatedLogoSplash } from '@/components/common/AnimatedLogoSplash';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainTabsNavigator } from '@/navigation/MainTabsNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { AuthStatus } from '@/types/auth-status';
import { palette, theme } from '@/utils/theme';

export function AppNavigator() {
  const { status } = useAuthContext();
  const { isOnboardingActive, loading: onboardingLoading } = useOnboardingContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  return (
    <NavigationContainer theme={navTheme}>
      {status === AuthStatus.BOOTSTRAPPING || (onboardingLoading && status !== AuthStatus.LOGGED_OUT && status !== AuthStatus.OTP_SENT) ? (
        <AnimatedLogoSplash />
      ) : status === AuthStatus.LOGGED_OUT || status === AuthStatus.OTP_SENT ? (
        <AuthNavigator key={status} />
      ) : status === AuthStatus.PHONE_VERIFIED || (status === AuthStatus.AUTHENTICATED && isOnboardingActive) ? (
        <OnboardingNavigator />
      ) : (
        <MainTabsNavigator />
      )}
    </NavigationContainer>
  );
}
