import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { updateWorkerProfile } from '@/actions';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingScreenGuard } from '@/hooks/useOnboarding';
import { AuthStatus } from '@/types/auth-status';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ONBOARDING_SCREENS.welcomeWorker>;

const AUTO_REDIRECT_SECONDS = 5;

export function WelcomeWorkerScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { refreshMe, completeOnboardingFlow, user } = useAuthContext();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const [continuing, setContinuing] = useState(false);
  const hasPersistedRef = useRef(false);
  const hasContinuedRef = useRef(false);

  useOnboardingScreenGuard({
    currentRoute: ONBOARDING_SCREENS.welcomeWorker,
    onRedirect: route => navigation.replace(route),
  });

  const persistWelcomeSeen = useCallback(async () => {
    if (hasPersistedRef.current) return;
    hasPersistedRef.current = true;
    try {
      await updateWorkerProfile({ hasSeenOnboardingWelcomeScreen: true });
    } catch {
      // proceed flow even if backend patch fails; next refresh can retry.
    }
  }, []);

  const continueToHome = useCallback(async () => {
    if (hasContinuedRef.current) return;
    hasContinuedRef.current = true;
    setContinuing(true);
    try {
      await persistWelcomeSeen();
      const nextStatus = await refreshMe();
      if (nextStatus !== AuthStatus.AUTHENTICATED) {
        completeOnboardingFlow();
      }
    } catch {
      completeOnboardingFlow();
    } finally {
      setContinuing(false);
    }
  }, [completeOnboardingFlow, persistWelcomeSeen, refreshMe]);

  useEffect(() => {
    void persistWelcomeSeen();
  }, [persistWelcomeSeen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          void continueToHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [continueToHome]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Partner';

  return (
    <GradientScreen contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}>
      <View className="rounded-3xl px-4 pb-6 pt-5" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
          <Text className="text-xs font-bold tracking-widest text-primary">{APP_TEXT.onboarding.welcome.step}</Text>
        </View>

        <Text className="mt-3 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white">Welcome</Text>
        <View className="mt-0.5">
          <GradientWord word={displayName} className="text-4xl font-extrabold leading-[40px]" />
        </View>
        <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.onboarding.welcome.subtitle}
        </Text>

        <View className="mt-5 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full border-2" style={{ borderColor: theme.colors.accent, backgroundColor: uiColors.surface.accentSoft20 }}>
            <Ionicons name="checkmark-done-outline" size={36} color={theme.colors.primary} />
          </View>
        </View>

        <View className="mt-5 rounded-2xl border px-4 py-4" style={{ borderColor: theme.colors.accent, backgroundColor: uiColors.surface.accentSoft20 }}>
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.onPrimary }}>
              <Ionicons name="rocket-outline" size={20} color={theme.colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold" style={{ color: theme.colors.primary }}>
                {APP_TEXT.onboarding.welcome.title}
              </Text>
              <Text className="mt-0.5 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {APP_TEXT.onboarding.welcome.autoRedirectLabel} ({secondsLeft}s)
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 gap-2">
          <View className="flex-row items-center rounded-xl border px-3 py-2" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85 }}>
            <Ionicons name="person-circle-outline" size={16} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-semibold text-baseDark dark:text-white">Profile completed</Text>
          </View>
          <View className="flex-row items-center rounded-xl border px-3 py-2" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85 }}>
            <Ionicons name="construct-outline" size={16} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-semibold text-baseDark dark:text-white">Onboarding preferences saved</Text>
          </View>
          <View className="flex-row items-center rounded-xl border px-3 py-2" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85 }}>
            <Ionicons name="speedometer-outline" size={16} color={theme.colors.primary} />
            <Text className="ml-2 text-xs font-semibold text-baseDark dark:text-white">You are ready to start receiving jobs</Text>
          </View>
        </View>
      </View>

      <View className="mt-5">
        <Button
          label={APP_TEXT.onboarding.welcome.button}
          onPress={() => {
            void continueToHome();
          }}
          loading={continuing}
          disabled={continuing}
        />
      </View>
    </GradientScreen>
  );
}
