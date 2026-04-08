import { useEffect, useMemo, useState } from 'react';
import { AppState, Image, Pressable, Text, View, useColorScheme } from 'react-native';

import { resendOtp } from '@/actions/authActions';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { OtpCodeInput } from '@/components/common/OtpCodeInput';
import { APP_TEXT } from '@/utils/appText';
import { BRAND } from '@/constants/brand';
import { useAuth } from '@/hooks/useAuth';
import { AppIcon } from '@/icons';
import { maskPhoneNumber, palette, theme, uiColors } from '@/utils';

type Props = {
  route: {
    params: {
      phone: string;
    };
  };
  navigation: {
    canGoBack: () => boolean;
    goBack: () => void;
  };
};

export function OtpVerificationScreen({ route, navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const phoneNumber = route.params.phone;
  const { verifyOtpAndSignIn } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const resendDuration = 60;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [resendAvailableAt, setResendAvailableAt] = useState(() => Date.now() + resendDuration * 1000);

  const maskedPhone = useMemo(() => maskPhoneNumber(phoneNumber), [phoneNumber]);
  const isBusy = loading || resending;
  const counter = Math.max(0, Math.ceil((resendAvailableAt - nowMs) / 1000));
  const canResend = counter <= 0 && !isBusy;
  const resendProgress = Math.max(0, Math.min(1, counter / resendDuration));

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
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
    if (otp.length !== 4) {
      return;
    }

    setLoading(true);
    try {
      await verifyOtpAndSignIn({ phone: phoneNumber, otp });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!canResend) {
      return;
    }

    try {
      setResending(true);
      await resendOtp(phoneNumber);
      setResendAvailableAt(Date.now() + resendDuration * 1000);
      setNowMs(Date.now());
    } finally {
      setResending(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, padding: 0, paddingBottom: 24 }}
    >
      <View className="flex-1">
        <View className="px-6 pb-5 pt-4">
          <BackButton
            onPress={() => navigation.goBack()}
            visible={navigation.canGoBack()}
            disabled={isBusy}
          />

          <View className="items-center">
            <Image
              source={require('@/assets/images/png/dellite_logo.png')}
              resizeMode="contain"
              style={{ width: BRAND.logo.width, height: BRAND.logo.height, marginTop: 8 }}
            />
            <Image
              source={require('@/assets/images/png/otp-verify-illustration.png')}
              resizeMode="contain"
              style={{ width: 148, height: 104, marginTop: 8 }}
            />
          </View>
        </View>

        <View className="px-6 pt-5">
          <Text
            className="text-center text-3xl font-extrabold"
            style={{ color: isDark ? palette.dark.text : uiColors.text.heading }}
          >
            {APP_TEXT.auth.otpVerification.title}
          </Text>
          <Text
            className="mt-3 text-center text-base"
            style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
          >
            {APP_TEXT.auth.otpVerification.codeSentPrefix}
            <Text className="font-semibold">{maskedPhone}</Text>
          </Text>

          <View className="mt-6">
            <OtpCodeInput value={otp} onChange={setOtp} length={4} disabled={isBusy} />
          </View>

          <View className="mt-5">
            {counter > 0 ? (
              <View style={{ gap: 8 }}>
                <Text
                  className="text-center text-sm"
                  style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
                >
                  Resend code in{' '}
                  <Text className="font-semibold text-primary">
                    00:{counter.toString().padStart(2, '0')}
                  </Text>
                </Text>
                <View
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight }}
                >
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max(6, resendProgress * 100)}%`,
                    }}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={onResend}
                disabled={!canResend}
                className="self-center flex-row items-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2"
                style={{ gap: 6 }}
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
              disabled={otp.length !== 4 || isBusy}
            />
          </View>

          <Text
            className="mt-6 text-center text-xs"
            style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}
          >
            {APP_TEXT.auth.otpVerification.helpText}
          </Text>
        </View>
      </View>
    </GradientScreen>
  );
}

