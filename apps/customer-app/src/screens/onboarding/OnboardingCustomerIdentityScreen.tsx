import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { AppInput } from '@/components/common/AppInput';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfilePhotoUploadPlaceholder } from '@/components/common/ProfilePhotoUploadPlaceholder';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { APP_TEXT } from '@/utils/appText';
import { useAuthContext } from '@/contexts/AuthContext';
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
import { showError } from '@/utils/toast';

const genderOptions = Array.isArray(GENDER_OPTIONS) ? GENDER_OPTIONS : [];
const PROFILE_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function OnboardingCustomerIdentityScreen() {
  const isDark = useColorScheme() === 'dark';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [profileImage, setProfileImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOnboarding, loading } = useAuthContext();
  const formDisabled = loading || isSubmitting;
  const text = APP_TEXT.onboarding.identity;

  const normalizedEmail = email.trim();
  const hasValidEmail = normalizedEmail.length === 0 || /\S+@\S+\.\S+/.test(normalizedEmail);
  const isValid = isValidFirstName(firstName) && isValidLastName(lastName) && hasValidEmail && Boolean(gender);

  const onPickProfileImage = async () => {
    if (formDisabled) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ['image/png', 'image/jpeg'],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      if (typeof asset.size === 'number' && asset.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
        showError('Profile image size must be 2MB or less.');
        return;
      }
      setProfileImage({
        uri: asset.uri,
        name: asset.name ?? `profile-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    } catch {
      showError('Could not pick profile image. Please try again.');
    }
  };

  const onContinue = async () => {
    if (!isValid || formDisabled) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        email: normalizedEmail || undefined,
        gender: gender ?? undefined,
        referralCode: referralCode.trim() || undefined,
        file: profileImage ?? undefined,
      });
    } catch {
      // Toasts are shown from API layer.
    } finally {
      setIsSubmitting(false);
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
            subtitle={`${text.uploadPhotoSubtitle} • Max 2MB`}
            imageUri={profileImage?.uri ?? null}
            onPress={() => {
              void onPickProfileImage();
            }}
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
        <Button label={text.nextButton} onPress={onContinue} loading={isSubmitting} disabled={!isValid || formDisabled} />
      </View>
    </GradientScreen>
  );
}

