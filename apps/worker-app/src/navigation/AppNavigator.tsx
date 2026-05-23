import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { JobDetailsNavigator } from '@/navigation/JobDetailsNavigator';
import { MainTabsNavigator } from '@/navigation/MainTabsNavigator';
import { OnboardingNavigator } from '@/navigation/OnboardingNavigator';
import { AuthStatus } from '@/types/auth-status';
import { RootStackParamList } from '@/types/navigation';
import { ROOT_SCREENS } from '@/types/screen-names';
import { palette, theme } from '@/utils/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

function BootstrapScreenFallback() {
  const isDark = useColorScheme() === 'dark';
  return <View style={{ flex: 1, backgroundColor: isDark ? palette.dark.background : palette.light.background }} />;
}

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
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {status === AuthStatus.BOOTSTRAPPING || (onboardingLoading && status !== AuthStatus.LOGGED_OUT && status !== AuthStatus.OTP_SENT) ? (
          <RootStack.Screen
            name={ROOT_SCREENS.mainTabsNavigator}
            component={BootstrapScreenFallback}
          />
        ) : status === AuthStatus.LOGGED_OUT || status === AuthStatus.OTP_SENT ? (
          <RootStack.Screen name={ROOT_SCREENS.authNavigator} component={AuthNavigator} />
        ) : status === AuthStatus.ONBOARDING || status === AuthStatus.PHONE_VERIFIED || (status === AuthStatus.AUTHENTICATED && isOnboardingActive) ? (
          <RootStack.Screen name={ROOT_SCREENS.onboardingNavigator} component={OnboardingNavigator} />
        ) : (
          <>
            <RootStack.Screen name={ROOT_SCREENS.mainTabsNavigator} component={MainTabsNavigator} />
            <RootStack.Screen name={ROOT_SCREENS.jobDetailsNavigator} component={JobDetailsNavigator} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
