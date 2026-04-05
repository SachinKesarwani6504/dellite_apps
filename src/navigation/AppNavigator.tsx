import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useMemo } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainTabsNavigator } from '@/navigation/MainTabsNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { AuthStatus } from '@/types/auth-status';
import { palette, theme } from '@/utils/theme';

export function AppNavigator() {
  const { status } = useAuth();
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
      {status === AuthStatus.BOOTSTRAPPING ? (
        <View className="flex-1 items-center justify-center bg-white dark:bg-baseDark">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : status === AuthStatus.LOGGED_OUT ? (
        <AuthNavigator />
      ) : status === AuthStatus.PHONE_VERIFIED || status === AuthStatus.ONBOARDING ? (
        <OnboardingNavigator />
      ) : (
        <MainTabsNavigator />
      )}
    </NavigationContainer>
  );
}

