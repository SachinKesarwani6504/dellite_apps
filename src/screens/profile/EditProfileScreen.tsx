import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { updateWorkerProfile } from '@/actions';
import { AppInput } from '@/components/common/AppInput';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { ProfilePhotoUploadPlaceholder } from '@/components/common/ProfilePhotoUploadPlaceholder';
import { useAuthContext } from '@/contexts/AuthContext';
import { Gender } from '@/types/auth';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { GENDER_OPTIONS } from '@/utils/options';
import { palette, theme, uiColors } from '@/utils/theme';
import { isValidFirstName, isValidLastName, normalizePersonName } from '@/utils/validation';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.editProfile>;
const genderOptions = Array.isArray(GENDER_OPTIONS) ? GENDER_OPTIONS : [];

export function EditProfileScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { user, refreshMe } = useAuthContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(String(user?.firstName ?? ''));
    setLastName(String(user?.lastName ?? ''));
    setEmail(String(user?.email ?? ''));
    if (user?.gender === 'MALE' || user?.gender === 'FEMALE' || user?.gender === 'OTHER') {
      setGender(user.gender);
    }
  }, [user?.email, user?.firstName, user?.gender, user?.lastName]);

  const isValid = isValidFirstName(firstName) && isValidLastName(lastName);

  const onSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await updateWorkerProfile({
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        email: email.trim() || undefined,
        gender,
      });
      await refreshMe();
      navigation.goBack();
    } catch {
      // Toasts are handled centrally in the HTTP layer.
    } finally {
      setSaving(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}
    >
      <View className="mb-3">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>

      <View className="rounded-3xl pb-6 pt-4" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
          <Text className="text-xs font-bold tracking-widest text-primary">UPDATE PROFILE</Text>
        </View>

        <Text className="mt-3 text-[36px] font-extrabold leading-[38px] text-baseDark dark:text-white">
          Update your
        </Text>
        <View className="mt-0.5">
          <GradientWord word="profile" />
        </View>
        <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          Keep your details accurate for better trust and job matching.
        </Text>

        <View className="mt-5">
          <ProfilePhotoUploadPlaceholder
            title={APP_TEXT.onboarding.identity.uploadPhotoTitle}
            subtitle={APP_TEXT.onboarding.identity.uploadPhotoSubtitle}
          />
        </View>

        <View className="mt-6 gap-3">
          <AppInput
            label={APP_TEXT.onboarding.identity.firstNameLabel}
            isRequired
            value={firstName}
            onChangeText={value => setFirstName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.firstNamePlaceholder}
            editable={!saving}
          />
          <AppInput
            label={APP_TEXT.onboarding.identity.lastNameLabel}
            isRequired
            value={lastName}
            onChangeText={value => setLastName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.lastNamePlaceholder}
            editable={!saving}
          />
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder={APP_TEXT.profile.edit.emailPlaceholder}
            keyboardType="email-address"
            editable={!saving}
          />
        </View>

        <Text className="mt-5 text-sm font-semibold text-baseDark dark:text-white">{APP_TEXT.onboarding.identity.genderLabel}</Text>
        <View className="mt-2 flex-row gap-2">
          {genderOptions.map(option => {
            const selected = option.value === gender;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (saving) return;
                  setGender(option.value);
                }}
                disabled={saving}
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
        <Button label={APP_TEXT.profile.edit.saveButton} onPress={onSave} loading={saving} disabled={!isValid || saving} />
      </View>
    </GradientScreen>
  );
}
