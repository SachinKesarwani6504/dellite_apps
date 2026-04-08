import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TextInput, View, useColorScheme } from 'react-native';

import { requestOtp } from '@/actions/authActions';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { TrustPills, type TrustPillItem } from '@/components/common/TrustPills';
import { APP_TEXT } from '@/constants/appText';
import { BRAND } from '@/constants/brand';
import { AUTH_SCREEN, palette, theme, uiColors } from '@/utils';

type Props = {
  navigation: {
    navigate: (screen: string, params: { phone: string }) => void;
  };
};

const TRUST_PILLS: TrustPillItem[] = [
  { id: 'verified', label: 'Verified Experts', icon: 'shield-checkmark-outline' },
  { id: 'rated', label: 'Top Rated', icon: 'star-outline' },
  { id: 'ontime', label: 'On-Time Service', icon: 'time-outline' },
  { id: 'services', label: '100+ Services', icon: 'home-outline' },
];

export function PhoneLoginScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [activePillId, setActivePillId] = useState(TRUST_PILLS[0].id);
  const isDark = useColorScheme() === 'dark';
  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  const isPhoneComplete = normalizedPhone.length === 10;

  const onContinue = useCallback(async () => {
    if (!isPhoneComplete) {
      return;
    }

    setLoading(true);
    try {
      await requestOtp({ phone: normalizedPhone });
      navigation.navigate(AUTH_SCREEN.OTP_VERIFICATION, { phone: normalizedPhone });
    } finally {
      setLoading(false);
    }
  }, [isPhoneComplete, navigation, normalizedPhone]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePillId((current) => {
        const index = TRUST_PILLS.findIndex((pill) => pill.id === current);
        const nextIndex = index === -1 ? 0 : (index + 1) % TRUST_PILLS.length;
        return TRUST_PILLS[nextIndex].id;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GradientScreen
      contentContainerStyle={{ padding: 0, paddingBottom: 24 }}
    >
      <View className="flex-1">
        <View className="items-center pb-8 pt-10">
          <Image
            source={require('@/assets/images/png/dellite_logo.png')}
            resizeMode="contain"
            style={{ width: BRAND.logo.width, height: BRAND.logo.height }}
          />
          <Image
            source={require('@/assets/images/png/customer-login-illustration.png')}
            resizeMode="contain"
            style={{ width: 230, height: 180, marginTop: 18 }}
          />
        </View>

        <View className="px-6 pt-7">
          <Text
            className="text-center text-4xl font-extrabold"
            style={{ color: isDark ? palette.dark.text : uiColors.text.heading }}
          >
            Welcome to Dellite
          </Text>
          <Text
            className="mt-3 text-center text-base"
            style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}
          >
            {APP_TEXT.auth.phoneLogin.subtitle}
          </Text>

   
          <View
            className="mt-6 rounded-2xl border"
            style={{
              borderColor: isPhoneFocused ? theme.colors.primary : isDark ? uiColors.surface.overlayDark14 : palette.light.border,
              backgroundColor: isDark ? palette.dark.card : palette.light.card,
              borderRadius: 16,
              transform: [{ translateY: isPhoneFocused ? -1 : 0 }],
              shadowColor: uiColors.shadow.focus,
              shadowOpacity: isPhoneFocused ? 0.18 : 0.05,
              shadowRadius: isPhoneFocused ? 10 : 3,
              shadowOffset: { width: 0, height: isPhoneFocused ? 6 : 2 },
              elevation: isPhoneFocused ? 5 : 1,
            }}
          >
            <View
              className="flex-row items-center rounded-2xl"
              style={{ backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card }}
            >
              <View
                className="w-20 py-4"
                style={{ borderRightWidth: 1, borderRightColor: isDark ? uiColors.surface.overlayDark14 : palette.light.border }}
              >
                <Text
                  className="text-center text-base font-semibold"
                  style={{ color: isDark ? palette.dark.text : theme.colors.baseDark }}
                >
                  {APP_TEXT.auth.phoneLogin.countryCode}
                </Text>
              </View>
              <View className="flex-1 px-3">
                <TextInput
                  value={phoneNumber}
                  onChangeText={(value) => setPhoneNumber(value.replace(/\D/g, ''))}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  editable={!loading}
                  placeholder={APP_TEXT.auth.phoneLogin.phonePlaceholder}
                  placeholderTextColor={uiColors.text.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={{ includeFontPadding: false, color: isDark ? palette.dark.text : theme.colors.baseDark }}
                  className="py-4 text-base font-semibold"
                />
              </View>
            </View>
          </View>

          <View className="mt-5">
            <Button
              label={APP_TEXT.auth.phoneLogin.sendOtpButton}
              onPress={onContinue}
              loading={loading}
              disabled={loading || !isPhoneComplete}
            />
          </View>
          <View className="mt-6 flex-row items-center justify-center" style={{ gap: 24 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name="shield-checkmark-outline" size={15} color={theme.colors.primary} />
              <Text
                className="text-sm"
                style={{ color: isDark ? uiColors.text.helperDark : uiColors.text.helperLight }}
              >
                {APP_TEXT.auth.phoneLogin.securePrivate}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name="sparkles-outline" size={15} color={theme.colors.primary} />
              <Text
                className="text-sm"
                style={{ color: isDark ? uiColors.text.helperDark : uiColors.text.helperLight }}
              >
                {APP_TEXT.auth.phoneLogin.noSpam}
              </Text>
            </View>
          </View>

          <Text
            className="mt-5 text-center text-xs"
            style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}
          >
            {APP_TEXT.auth.phoneLogin.terms}
          </Text>
        </View>
      </View>
    </GradientScreen>
  );
}
