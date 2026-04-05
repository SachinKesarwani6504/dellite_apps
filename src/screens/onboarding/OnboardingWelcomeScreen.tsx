import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingStackParamList } from '@/types/navigation';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingWelcome'>;

export function OnboardingWelcomeScreen({}: Props) {
  const isDark = useColorScheme() === 'dark';
  const { completeOnboardingFlow } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      completeOnboardingFlow();
    }, 3000);
    return () => clearTimeout(timer);
  }, [completeOnboardingFlow]);

  return (
    <GradientScreen
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 22,
        paddingHorizontal: APP_LAYOUT.screenHorizontalPadding,
      }}
    >
      <View className="rounded-3xl px-5 pb-6 pt-5" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <Text className="text-xs font-bold tracking-widest text-primary">{APP_TEXT.onboarding.welcome.step}</Text>
        <Text className="mt-3 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white">
          {APP_TEXT.onboarding.welcome.title}
        </Text>
        <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>{APP_TEXT.onboarding.welcome.subtitle}</Text>

        <View className="mt-6 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full border border-accent/50" style={{ backgroundColor: isDark ? uiColors.surface.avatarDark : theme.colors.surfaceSoft }}>
            <Text className="text-4xl">🎉</Text>
          </View>
        </View>
      </View>

      <Text className="mt-5 text-center text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
        Redirecting to dashboard...
      </Text>
    </GradientScreen>
  );
}

