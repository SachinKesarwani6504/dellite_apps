import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      useGradient
      gradientColors={theme.gradients.hero}
      gradientStart={{ x: 0, y: 0 }}
      gradientEnd={{ x: 0, y: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 22,
        paddingHorizontal: APP_LAYOUT.screenHorizontalPadding,
      }}
    >
      <View
        className="overflow-hidden rounded-[30px] border"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : theme.colors.surfaceSoft,
          backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card,
        }}
      >
        <LinearGradient
          colors={theme.gradients.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 10 }}
        />

        <View className="px-5 pb-6 pt-5">
          <Text className="text-xs font-bold tracking-widest text-primary">{APP_TEXT.onboarding.welcome.step}</Text>

          <View className="mt-5 items-center">
            <View
              className="h-28 w-28 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
            >
              <LinearGradient
                colors={theme.gradients.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 88, width: 88, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="checkmark" size={42} color={theme.colors.onPrimary} />
              </LinearGradient>
            </View>
          </View>

          <Text className="mt-6 text-center text-4xl font-extrabold leading-[42px] text-baseDark dark:text-white">
            {APP_TEXT.onboarding.welcome.title}
          </Text>
          <Text className="mt-3 text-center text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {APP_TEXT.onboarding.welcome.subtitle}
          </Text>

          <View className="mt-6 rounded-2xl px-4 py-4" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.accentSoft20 }}>
            <View className="flex-row items-start">
              <View className="mr-3 mt-0.5 h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : palette.light.card }}>
                <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-baseDark dark:text-white">
                  Profile submitted successfully
                </Text>
                <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  Your worker profile is ready. We are taking you to the dashboard while verification continues in the background.
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                Preparing Dashboard
              </Text>
              <Text className="text-xs font-semibold text-primary">Almost there</Text>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight }}>
              <LinearGradient
                colors={theme.gradients.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: '100%', width: '82%', borderRadius: 999 }}
              />
            </View>
          </View>
        </View>
      </View>

      <Text className="mt-5 text-center text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
        Redirecting to dashboard in a moment...
      </Text>
    </GradientScreen>
  );
}
