import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { customerActions } from '@/actions';
import { AppInput } from '@/components/common/AppInput';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { APP_TEXT } from '@/utils/appText';
import { useAuth } from '@/hooks/useAuth';
import type { Gender } from '@/types/auth';
import { APP_LAYOUT, GENDER_OPTIONS, isValidFirstName, isValidLastName, normalizePersonName, palette, theme, uiColors } from '@/utils';

const genderOptions = Array.isArray(GENDER_OPTIONS) ? GENDER_OPTIONS : [];

export function EditProfileScreen() {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';
  const { authState, refreshMe, loading } = useAuth();
  const user = authState.user;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [saving, setSaving] = useState(false);
  const formDisabled = saving || loading;

  useEffect(() => {
    setFirstName(String(user?.firstName ?? ''));
    setLastName(String(user?.lastName ?? ''));
    setEmail(String(user?.email ?? ''));
    if (user?.gender === 'MALE' || user?.gender === 'FEMALE' || user?.gender === 'OTHER') {
      setGender(user.gender);
    }
  }, [user?.email, user?.firstName, user?.gender, user?.lastName]);

  const normalizedEmail = useMemo(() => email.trim(), [email]);
  const hasValidEmail = normalizedEmail.length === 0 || /\S+@\S+\.\S+/.test(normalizedEmail);
  const isValid = isValidFirstName(firstName) && isValidLastName(lastName) && hasValidEmail;

  const handleSave = async () => {
    if (!isValid || formDisabled) {
      return;
    }

    setSaving(true);
    try {
      await customerActions.updateCustomerProfile({
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        email: normalizedEmail || undefined,
        gender,
      });
      await refreshMe();
      navigation.goBack();
    } catch {
      // Toasts are handled in the HTTP layer.
    } finally {
      setSaving(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}
    >
      <View className="mb-3">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} disabled={formDisabled} />
      </View>

      <View className="rounded-3xl pb-6 pt-4" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
          <Text className="text-xs font-bold tracking-widest text-primary">{APP_TEXT.profile.edit.step}</Text>
        </View>
        <Text className="mt-3 text-[36px] font-extrabold leading-[38px] text-baseDark dark:text-white">
          {APP_TEXT.profile.edit.titlePrefix}
        </Text>
        <View className="mt-0.5">
          <GradientWord word={APP_TEXT.profile.edit.titleGradientWord} />
        </View>
        <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.profile.edit.subtitle}
        </Text>

        <View className="mt-6 gap-3">
          <AppInput
            label={APP_TEXT.onboarding.identity.firstNameLabel}
            isRequired
            value={firstName}
            onChangeText={(value) => setFirstName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.firstNamePlaceholder}
            editable={!formDisabled}
          />
          <AppInput
            label={APP_TEXT.onboarding.identity.lastNameLabel}
            isRequired
            value={lastName}
            onChangeText={(value) => setLastName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.lastNamePlaceholder}
            editable={!formDisabled}
          />
          <AppInput
            label={APP_TEXT.profile.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={APP_TEXT.profile.edit.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!formDisabled}
          />
        </View>

        <Text className="mt-5 text-sm font-semibold text-baseDark dark:text-white">
          {APP_TEXT.onboarding.identity.genderLabel}
        </Text>
        <View className="mt-2 flex-row gap-2">
          {genderOptions.map((option) => {
            const selected = option.value === gender;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (formDisabled) {
                    return;
                  }
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
        <Button
          label={APP_TEXT.profile.edit.saveButton}
          onPress={handleSave}
          loading={saving}
          disabled={!isValid || formDisabled}
        />
      </View>
    </GradientScreen>
  );
}

