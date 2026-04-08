import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Image, Pressable, Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { OtpCodeInput } from '@/components/common/OtpCodeInput';
import { useAuthContext } from '@/contexts/AuthContext';
import { AppIcon } from '@/icons';
import { AuthStackParamList } from '@/types/navigation';
import { AUTH_SCREENS } from '@/types/screen-names';
import { maskPhoneNumber } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';
import { isValidOtp, normalizeOtp } from '@/utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, typeof AUTH_SCREENS.otpVerification>;

export function OtpVerificationScreen({ route, navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const heroGradient = isDark
    ? ([palette.dark.background, uiColors.surface.cardDefaultDark] as const)
    : theme.gradients.hero;
  const { phoneNumber } = route.params;
  const { verifyOtpCode, resendOtpCode, loading } = useAuthContext();
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const resendDuration = 60;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [resendAvailableAt, setResendAvailableAt] = useState(() => Date.now() + resendDuration * 1000);
  const maskedPhone = useMemo(() => maskPhoneNumber(phoneNumber), [phoneNumber]);
  const isBusy = loading || resending;
  const counter = Math.max(0, Math.ceil((resendAvailableAt - nowMs) / 1000));
  const canResend = counter <= 0 && !isBusy;
  const resendProgress = Math.max(0, Math.min(1, counter / resendDuration));
  const otpIllustration = require('@/assets/images/png/otp-verify-illustration.png');

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    const appStateSubscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        setNowMs(Date.now());
      }
    });

    return () => {
      clearInterval(timer);
      appStateSubscription.remove();
    };
  }, []);

  const onVerify = async () => {
    try {
      const normalizedOtp = normalizeOtp(otp);
      if (!isValidOtp(normalizedOtp) || isBusy) return;
      await verifyOtpCode(phoneNumber, normalizedOtp);
    } catch {
      // Toasts are handled centrally in the HTTP layer.
    }
  };

  const onResend = async () => {
    if (counter > 0) return;
    try {
      setResending(true);
      await resendOtpCode(phoneNumber);
      setResendAvailableAt(Date.now() + resendDuration * 1000);
      setNowMs(Date.now());
    } catch {
      // Toasts are handled centrally in the HTTP layer.
    } finally {
      setResending(false);
    }
  };

  return (
    <GradientScreen
      useGradient
      gradientColors={heroGradient}
      gradientStart={{ x: 0, y: 0 }}
      gradientEnd={{ x: 0, y: 1 }}
      contentContainerStyle={{ flexGrow: 1, padding: 0, paddingBottom: 24 }}
    >
      <View className="flex-1">
        <View className="px-6 pb-8 pt-6">
          <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />

          <View className="items-center">
            <Image
              source={otpIllustration}
              resizeMode="contain"
              style={{ width: 160, height: 120, marginTop: 12 }}
            />
          </View>
        </View>

        <View className="px-6 pt-7">
          <Text className="text-center text-4xl font-extrabold" style={{ color: isDark ? palette.dark.text : uiColors.text.heading }}>
            {APP_TEXT.auth.otpVerification.title}
          </Text>
          <Text className="mt-3 text-center text-base" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {APP_TEXT.auth.otpVerification.codeSentPrefix}
            <Text className="font-semibold">{maskedPhone}</Text>
          </Text>

          <View className="mt-6">
            <OtpCodeInput value={otp} onChange={value => setOtp(normalizeOtp(value))} length={4} disabled={isBusy} />
          </View>

          <View className="mt-5">
            {counter > 0 ? (
              <View className="space-y-2">
                <Text className="text-center text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  Resend code in{' '}
                  <Text className="font-semibold text-primary">
                    00:{counter.toString().padStart(2, '0')}
                  </Text>
                </Text>
                <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight }}>
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(6, resendProgress * 100)}%` }}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={onResend}
                disabled={!canResend}
                className="self-center flex-row items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2"
              >
                <AppIcon name="refresh" size={14} color={theme.colors.primary} />
                <Text className="text-sm font-semibold text-primary">Resend code</Text>
              </Pressable>
            )}
          </View>

          <View className="mt-5">
            <Button
              label={APP_TEXT.auth.otpVerification.verifyButton}
              onPress={onVerify}
              loading={loading}
              disabled={!isValidOtp(otp) || isBusy}
            />
          </View>

          <Text className="mt-6 text-center text-xs" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
            {APP_TEXT.auth.otpVerification.helpText}
          </Text>
        </View>
      </View>
    </GradientScreen>
  );
}

