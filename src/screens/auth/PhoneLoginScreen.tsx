import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Text, TextInput, View, useColorScheme } from 'react-native';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useAuth } from '@/hooks/useAuth';
import { APP_AUTH_ROLE } from '@/types/auth';
import { AuthStackParamList } from '@/types/navigation';
import { AUTH_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, typeof AUTH_SCREENS.phoneLogin>;

export function PhoneLoginScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const { sendOtpCode, loading } = useAuth();
  const logo = require('@/assets/images/png/dellite_logo.png');
  const phoneIllustration = require('@/assets/images/png/phone-verify-illustration.png');

  const onContinue = async () => {
    try {
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
      if (!isValidPhoneNumber(normalizedPhoneNumber) || loading) return;
      await sendOtpCode(normalizedPhoneNumber, APP_AUTH_ROLE);
      navigation.navigate(AUTH_SCREENS.otpVerification, { phoneNumber: normalizedPhoneNumber });
    } catch {
      // Toasts are handled centrally in the HTTP layer.
    }
  };

  return (
    <GradientScreen
      useGradient
      gradientColors={theme.gradients.hero}
      gradientStart={{ x: 0, y: 0 }}
      gradientEnd={{ x: 0, y: 1 }}
      contentContainerStyle={{ padding: 0, paddingBottom: 24 }}
    >
      <View className="flex-1">
        <View className="items-center px-6 pb-8 pt-10">
          <Image source={logo} resizeMode="contain" style={{ width: 140, height: 42 }} />
          <Image
            source={phoneIllustration}
            resizeMode="contain"
            style={{ width: 230, height: 180, marginTop: 18 }}
          />
        </View>

        <View className="px-6 pt-7">
          <Text className="text-center text-4xl font-extrabold" style={{ color: isDark ? palette.dark.text : uiColors.text.heading }}>
            {APP_TEXT.auth.phoneLogin.title}
          </Text>
          <Text className="mt-3 text-center text-base" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {APP_TEXT.auth.phoneLogin.subtitle}
          </Text>

          <View
            className={`mt-6 rounded-2xl border ${
              isPhoneFocused ? 'border-primary' : 'border-accent/70 dark:border-white/10'
            }`}
            style={{
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
            <View className="flex-row items-center rounded-2xl" style={{ backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card }}>
              <View className="w-20 border-r border-accent/60 py-4 dark:border-white/10">
                <Text className="text-center text-base font-semibold text-baseDark dark:text-white">
                  {APP_TEXT.auth.phoneLogin.countryCode}
                </Text>
              </View>
              <View className="flex-1 px-3">
                <TextInput
                  value={phoneNumber}
                  onChangeText={value => setPhoneNumber(normalizePhoneNumber(value))}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  placeholder={APP_TEXT.auth.phoneLogin.phonePlaceholder}
                  placeholderTextColor={uiColors.text.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={{ includeFontPadding: false }}
                  className="py-4 text-base font-semibold text-baseDark dark:text-white"
                />
              </View>
            </View>
          </View>

          <View className="mt-5">
            <Button
              label={APP_TEXT.auth.phoneLogin.sendOtpButton}
              onPress={onContinue}
              loading={loading}
              disabled={loading || !isValidPhoneNumber(phoneNumber)}
            />
          </View>

          <View className="mt-6 flex-row items-center justify-center gap-6">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark-outline" size={15} color={theme.colors.primary} />
              <Text className="text-sm" style={{ color: isDark ? uiColors.text.helperDark : uiColors.text.helperLight }}>
                {APP_TEXT.auth.phoneLogin.securePrivate}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="sparkles-outline" size={15} color={theme.colors.primary} />
              <Text className="text-sm" style={{ color: isDark ? uiColors.text.helperDark : uiColors.text.helperLight }}>
                {APP_TEXT.auth.phoneLogin.noSpam}
              </Text>
            </View>
          </View>

          <Text className="mt-5 text-center text-xs" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
            {APP_TEXT.auth.phoneLogin.terms}
          </Text>
        </View>
      </View>
    </GradientScreen>
  );
}
