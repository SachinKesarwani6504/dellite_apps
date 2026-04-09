import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { AppInput } from '@/components/common/AppInput';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfilePhotoUploadPlaceholder } from '@/components/common/ProfilePhotoUploadPlaceholder';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { APP_TEXT } from '@/utils/appText';
import { useAuth } from '@/hooks/useAuth';
import type { Gender } from '@/types/auth';
import {
  APP_LAYOUT,
  GENDER_OPTIONS,
  isValidFirstName,
  isValidLastName,
  normalizePersonName,
  palette,
  uiColors,
} from '@/utils';
const genderOptions = Array.isArray(GENDER_OPTIONS) ? GENDER_OPTIONS : [];

export function OnboardingCustomerIdentityScreen() {
  const isDark = useColorScheme() === 'dark';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const { completeOnboarding, loading } = useAuth();
  const formDisabled = loading;
  const text = APP_TEXT.onboarding.identity;

  const normalizedEmail = email.trim();
  const hasValidEmail = normalizedEmail.length === 0 || /\S+@\S+\.\S+/.test(normalizedEmail);
  const isValid = isValidFirstName(firstName) && isValidLastName(lastName) && hasValidEmail && Boolean(gender);

  const onContinue = async () => {
    if (!isValid || loading) return;
    try {
      await completeOnboarding({
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        email: normalizedEmail || undefined,
        gender: gender ?? undefined,
        referralCode: referralCode.trim() || undefined,
      });
    } catch {
      // Toasts are shown from API layer.
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}
    >
      <View className="rounded-3xl pb-6 pt-4" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <SplitGradientTitle
          eyebrow={text.step}
          prefix={text.titlePrefix}
          highlight={text.gradientWord}
          subtitle={text.subtitle}
        />
        <View className="mt-5 items-center">
          <ProfilePhotoUploadPlaceholder
            title={text.uploadPhotoTitle}
            subtitle={text.uploadPhotoSubtitle}
          />
        </View>

        <View className="mt-6 gap-3">
          <AppInput
            label={text.firstNameLabel}
            isRequired
            value={firstName}
            onChangeText={(value) => setFirstName(normalizePersonName(value))}
            placeholder={text.firstNamePlaceholder}
            editable={!formDisabled}
          />
          <AppInput
            label={text.lastNameLabel}
            isRequired
            value={lastName}
            onChangeText={(value) => setLastName(normalizePersonName(value))}
            placeholder={text.lastNamePlaceholder}
            editable={!formDisabled}
          />
          <AppInput
            label={text.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={text.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!formDisabled}
          />
          <AppInput
            label={text.referralLabel}
            value={referralCode}
            onChangeText={(value) => setReferralCode(value.replace(/\s+/g, '').toUpperCase())}
            autoCapitalize="characters"
            placeholder={text.referralPlaceholder}
            editable={!formDisabled}
          />
        </View>
        <Text className="mt-5 text-sm font-semibold text-baseDark dark:text-white">
          {text.genderLabel}
        </Text>
        <View className="mt-2 flex-row gap-2">
          {genderOptions.map(option => {
            const selected = option.value === gender;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (formDisabled) return;
                  setGender(option.value);
                }}
                disabled={formDisabled}
                className={`flex-1 rounded-2xl border p-3 ${
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-accent/40 bg-white dark:border-white/10'
                }`}
                style={!selected ? { backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card } : undefined}
              >
                <Text className="text-center text-2xl">{option.icon}</Text>
                <Text
                  className={`mt-1 text-center text-sm font-semibold ${
                    selected ? 'text-primary' : 'text-baseDark dark:text-white'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View className="mt-5">
        <Button label={text.nextButton} onPress={onContinue} loading={loading} disabled={!isValid || loading} />
      </View>
    </GradientScreen>
  );
}

