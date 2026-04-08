import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, Text, View, useColorScheme } from 'react-native';
import { updateWorkerProfile } from '@/actions';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingScreenGuard } from '@/hooks/useOnboarding';
import { AppIcon } from '@/icons';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ONBOARDING_SCREENS.welcomeWorker>;

const WELCOME_IMAGE = require('@/assets/images/png/worker-welcome.png');

type BenefitItem = {
  key: 'locality' | 'schedule' | 'reputation';
  icon: keyof typeof Ionicons.glyphMap;
};

export function WelcomeWorkerScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { completeOnboardingFlow } = useAuthContext();
  const text = APP_TEXT.onboarding.welcome;
  const [persistingFlag, setPersistingFlag] = useState(false);
  const [starting, setStarting] = useState(false);
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasPersistedRef = useRef(false);
  const burstParticles = useMemo(
    () => [
      { angle: -90, distance: 70, size: 7, color: theme.colors.caution, delay: 0 },
      { angle: -130, distance: 58, size: 6, color: theme.colors.primary, delay: 20 },
      { angle: -50, distance: 54, size: 6, color: theme.colors.accent, delay: 40 },
      { angle: -150, distance: 48, size: 5, color: theme.colors.secondary, delay: 50 },
      { angle: -30, distance: 46, size: 5, color: theme.colors.positive, delay: 60 },
      { angle: -170, distance: 40, size: 4, color: theme.colors.negative, delay: 70 },
      { angle: -10, distance: 38, size: 4, color: theme.colors.caution, delay: 80 },
      { angle: -110, distance: 44, size: 5, color: theme.colors.primary, delay: 90 },
      { angle: -70, distance: 50, size: 5, color: theme.colors.accent, delay: 110 },
    ],
    [],
  );
  const animatedValues = useRef(burstParticles.map(() => new Animated.Value(0))).current;
  const ctaFloat = useRef(new Animated.Value(0)).current;
  const confettiParticles = useMemo(
    () => Array.from({ length: 20 }, (_, index) => ({
      x: -130 + Math.round(Math.random() * 260),
      delay: Math.round(Math.random() * 650),
      size: 4 + (index % 3),
      color: [theme.colors.primary, theme.colors.negative, theme.colors.caution, theme.colors.accent][index % 4],
    })),
    [],
  );
  const confettiValues = useRef(confettiParticles.map(() => new Animated.Value(0))).current;
  const cardBackground = isDark ? uiColors.surface.cardElevatedDark : uiColors.surface.overlayLight95;
  const cardBorder = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const perkGradients = useMemo<readonly [string, string][]>(
    () => [
      isDark
        ? [uiColors.surface.overlayDark14, uiColors.surface.overlayDark10]
        : [uiColors.surface.accentSoft20, uiColors.surface.overlayLight90],
      isDark
        ? [uiColors.surface.overlayDark14, uiColors.surface.cardMutedDark]
        : [uiColors.surface.overlayLight90, uiColors.surface.trackLight],
      isDark
        ? [uiColors.surface.overlayDark10, uiColors.surface.overlayDark14]
        : [uiColors.surface.trackLight, uiColors.surface.accentSoft20],
    ],
    [isDark],
  );
  const benefitLabels = text.benefits;
  const isBusy = starting || persistingFlag;

  useOnboardingScreenGuard({
    currentRoute: ONBOARDING_SCREENS.welcomeWorker,
    onRedirect: route => navigation.replace(route),
  });

  const persistWelcomeSeen = useCallback(async () => {
    if (hasPersistedRef.current) return;
    hasPersistedRef.current = true;
    setPersistingFlag(true);
    try {
      await updateWorkerProfile({ hasSeenOnboardingWelcomeScreen: true });
    } catch {
      // Screen flow should continue even if this request fails once.
    } finally {
      setPersistingFlag(false);
    }
  }, []);

  useEffect(() => {
    void persistWelcomeSeen();
  }, [persistWelcomeSeen]);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 800);
    const t3 = setTimeout(() => setStep(3), 1300);
    const t4 = setTimeout(() => setShowConfetti(true), 500);

    const animations = animatedValues.map((value, index) =>
      Animated.sequence([
        Animated.delay(burstParticles[index].delay),
        Animated.timing(value, {
          toValue: 1,
          duration: 820,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();

    const fallingAnimations = confettiValues.map((value, index) =>
      Animated.sequence([
        Animated.delay(confettiParticles[index].delay),
        Animated.timing(value, {
          toValue: 1,
          duration: 1900,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(fallingAnimations).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaFloat, {
          toValue: -4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ctaFloat, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      floatLoop.stop();
    };
  }, [animatedValues, burstParticles, confettiParticles, confettiValues, ctaFloat]);

  const onStartEarning = useCallback(async () => {
    if (isBusy) return;
    setStarting(true);
    try {
      completeOnboardingFlow();
    } finally {
      setStarting(false);
    }
  }, [completeOnboardingFlow, isBusy]);

  const benefits: BenefitItem[] = [
    {
      key: 'locality',
      icon: 'briefcase-outline',
    },
    {
      key: 'schedule',
      icon: 'wallet-outline',
    },
    {
      key: 'reputation',
      icon: 'star-outline',
    },
  ];

  return (
    <GradientScreen
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: APP_LAYOUT.screenHorizontalPadding,
        paddingTop: 16,
        paddingBottom: 20,
      }}
    >
      <View className="flex-1 justify-center">
        <View className="items-center">
          <Animated.View
            className="items-center"
            style={{
              opacity: step >= 1 ? 1 : 0,
              transform: [{ scale: step >= 1 ? 1 : 0.8 }],
            }}
          >
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: theme.colors.primary,
                shadowColor: uiColors.shadow.warm,
                shadowOpacity: 0.22,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              <Ionicons name="checkmark-circle" size={34} color={theme.colors.onPrimary} />
            </View>

            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {burstParticles.map((particle, index) => {
                const progress = animatedValues[index];
                const radians = (particle.angle * Math.PI) / 180;
                const toX = Math.cos(radians) * particle.distance;
                const toY = Math.sin(radians) * particle.distance;

                return (
                  <Animated.View
                    key={`burst-${index}`}
                    style={{
                      position: 'absolute',
                      width: particle.size,
                      height: particle.size,
                      borderRadius: particle.size / 2,
                      backgroundColor: particle.color,
                      opacity: progress.interpolate({
                        inputRange: [0, 0.1, 1],
                        outputRange: [0, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, toX],
                          }),
                        },
                        {
                          translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, toY],
                          }),
                        },
                        {
                          scale: progress.interpolate({
                            inputRange: [0, 0.4, 1],
                            outputRange: [0.2, 1, 0.4],
                          }),
                        },
                      ],
                    }}
                  />
                );
              })}
            </View>

            {showConfetti ? (
              <View pointerEvents="none" style={{ position: 'absolute', top: -20, left: 0, right: 0, bottom: 0 }}>
                {confettiParticles.map((particle, index) => {
                  const progress = confettiValues[index];
                  return (
                    <Animated.View
                      key={`fall-${index}`}
                      style={{
                        position: 'absolute',
                        width: particle.size,
                        height: particle.size,
                        borderRadius: particle.size / 2,
                        left: '50%',
                        top: 0,
                        marginLeft: particle.x,
                        backgroundColor: particle.color,
                        opacity: progress.interpolate({
                          inputRange: [0, 0.15, 0.85, 1],
                          outputRange: [0, 1, 1, 0],
                        }),
                        transform: [
                          {
                            translateY: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 520],
                            }),
                          },
                          {
                            rotate: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '540deg'],
                            }),
                          },
                        ],
                      }}
                    />
                  );
                })}
              </View>
            ) : null}
          </Animated.View>

          <Animated.View
            className="mt-5 flex-row items-center"
            style={{
              opacity: step >= 1 ? 1 : 0,
              transform: [{ translateY: step >= 1 ? 0 : 12 }],
            }}
          >
            <Text className="text-center text-[42px] font-extrabold leading-[46px] text-baseDark dark:text-white">
              You're{' '}
            </Text>
            <GradientWord
              word="All Set!"
              className="text-[42px] font-extrabold leading-[46px]"
            />
          </Animated.View>

          <Animated.Text
            className="mt-2 text-center text-[15px]"
            style={{
              color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight,
              opacity: step >= 1 ? 1 : 0,
              transform: [{ translateY: step >= 1 ? 0 : 12 }],
            }}
          >
            {text.subtitle}
          </Animated.Text>

          <Animated.View
            className="mt-4 items-center"
            style={{
              opacity: step >= 1 ? 1 : 0,
              transform: [{ scale: step >= 1 ? 1 : 0.78 }],
            }}
          >
            <Image source={WELCOME_IMAGE} resizeMode="contain" style={{ width: 196, height: 196 }} />
          </Animated.View>

          <Animated.View
            className="mt-2 w-full flex-row items-stretch"
            style={{
              gap: 8,
              opacity: step >= 2 ? 1 : 0,
              transform: [{ translateY: step >= 2 ? 0 : 22 }],
            }}
          >
            {benefits.map((item, index) => (
              <Animated.View
                key={item.key}
                className="flex-1 overflow-hidden rounded-2xl border"
                style={{
                  borderColor: cardBorder,
                  shadowColor: uiColors.shadow.base,
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 3,
                }}
              >
                <LinearGradient
                  colors={perkGradients[index]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.95, y: 1 }}
                  style={{
                    paddingHorizontal: 8,
                    paddingTop: 10,
                    paddingBottom: 12,
                    alignItems: 'center',
                    backgroundColor: cardBackground,
                  }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}
                  >
                    <Ionicons name={item.icon} size={21} color={theme.colors.primary} />
                  </View>
                  <Text
                    className="mt-2 text-center text-[12px] font-semibold leading-[16px]"
                    style={{ color: isDark ? palette.dark.text : theme.colors.baseDark }}
                  >
                    {benefitLabels[item.key]}
                  </Text>
                </LinearGradient>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View
            className="mt-8 w-[74%]"
            style={{
              opacity: step >= 3 ? 1 : 0,
              transform: [{ translateY: step >= 3 ? ctaFloat : 12 }],
            }}
          >
            <Pressable
              onPress={() => void onStartEarning()}
              disabled={isBusy}
              className={isBusy ? 'opacity-70' : ''}
              style={{ borderRadius: 999, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={theme.gradients.cta}
                locations={[0, 0.25, 0.62, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 999,
                  paddingVertical: 13,
                  paddingHorizontal: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isBusy ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <>
                    <Text className="text-base font-semibold text-white">{text.button}</Text>
                    <AppIcon name="chevronRight" size={16} color={theme.colors.onPrimary} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </GradientScreen>
  );
}
