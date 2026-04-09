import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Image, Pressable, Text, View, useColorScheme } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from '@/components/common/Button';
import { AppInput } from '@/components/common/AppInput';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfilePhotoUploadPlaceholder } from '@/components/common/ProfilePhotoUploadPlaceholder';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useAuthContext } from '@/contexts/AuthContext';
import { Gender } from '@/types/auth';
import { OnboardingStackParamList } from '@/types/navigation';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { GENDER_OPTIONS } from '@/utils/options';
import { palette, theme, uiColors } from '@/utils/theme';
import { showError } from '@/utils/toast';
import {
  isValidFirstName,
  isValidLastName,
  normalizePersonName,
} from '@/utils/validation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingIdentity'>;
const genderOptions = Array.isArray(GENDER_OPTIONS) ? GENDER_OPTIONS : [];
type AadhaarFileSelection = {
  path: string;
  name: string;
};

export function OnboardingIdentityScreen({}: Props) {
  const isDark = useColorScheme() === 'dark';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState<AadhaarFileSelection | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<AadhaarFileSelection | null>(null);
  const [pickingSide, setPickingSide] = useState<'front' | 'back' | null>(null);
  const submittingRef = useRef(false);
  const { completeOnboarding, loading } = useAuthContext();
  const formDisabled = loading;

  const isValid = isValidFirstName(firstName) && isValidLastName(lastName) && Boolean(gender);

  const onContinue = async () => {
    if (loading || submittingRef.current) return;
    if (!isValid) {
      showError('Please enter first name, last name, and select gender.');
      return;
    }
    submittingRef.current = true;
    try {
      await completeOnboarding({
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        gender: gender ?? undefined,
        referralCode: referralCode.trim() || undefined,
        aadhaarFrontFilePath: aadhaarFront?.path ?? '',
        aadhaarFrontFileName: aadhaarFront?.name ?? '',
        aadhaarBackFilePath: aadhaarBack?.path ?? '',
        aadhaarBackFileName: aadhaarBack?.name ?? '',
      });
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message
        : 'Could not continue onboarding. Please try again.';
      showError(message);
    } finally {
      submittingRef.current = false;
    }
  };

  const pickAadhaarFile = async (side: 'front' | 'back') => {
    try {
      setPickingSide(side);
      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ['image/png', 'image/jpeg'],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      const fileName = asset.name ?? `aadhaar-${side}-${Date.now()}`;
      const isSupportedImage = /\.(png|jpg|jpeg)$/i.test(fileName);
      if (!isSupportedImage) return;
      const selection = {
        path: asset.uri,
        name: fileName,
      };
      if (side === 'front') {
        setAadhaarFront(selection);
      } else {
        setAadhaarBack(selection);
      }
    } catch {
      // Toasts are shown from API layer.
    } finally {
      setPickingSide(null);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}
    >
      <View className="rounded-3xl pb-6 pt-4" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <SplitGradientTitle
          eyebrow={APP_TEXT.onboarding.identity.step}
          prefix={APP_TEXT.onboarding.identity.titlePrefix}
          highlight={APP_TEXT.onboarding.identity.gradientWord}
          subtitle={APP_TEXT.onboarding.identity.subtitle}
        />
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
            editable={!formDisabled}
          />
          <AppInput
            label={APP_TEXT.onboarding.identity.lastNameLabel}
            isRequired
            value={lastName}
            onChangeText={value => setLastName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.lastNamePlaceholder}
            editable={!formDisabled}
          />
          <AppInput
            label={APP_TEXT.onboarding.identity.referralCodeLabel}
            value={referralCode}
            onChangeText={value => setReferralCode(value.replace(/\s+/g, '').toUpperCase())}
            placeholder={APP_TEXT.onboarding.identity.referralCodePlaceholder}
            autoCapitalize="characters"
            editable={!formDisabled}
          />
        </View>

        <View className="mt-5 flex-row items-center">
          <Text className="text-sm font-semibold text-baseDark dark:text-white">Aadhaar Uploads</Text>
          <Text className="ml-1 text-sm font-semibold" style={{ color: theme.colors.negative }}>*</Text>
        </View>
        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.onboarding.identity.aadhaarUploadHint}
        </Text>
        <View className="mt-2 gap-2">
          <Pressable
            onPress={() => {
              if (formDisabled || pickingSide !== null) return;
              void pickAadhaarFile('front');
            }}
            disabled={formDisabled || pickingSide !== null}
            className="rounded-2xl border border-dashed p-3"
            style={{
              borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.trackLight,
            }}
          >
            <View className="flex-row items-center">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
                <Ionicons name="document-attach-outline" size={18} color={theme.colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-sm font-semibold text-baseDark dark:text-white">{APP_TEXT.onboarding.identity.aadhaarFrontLabel}</Text>
                  <Text className="ml-1 text-sm font-semibold" style={{ color: theme.colors.negative }}>*</Text>
                </View>
                <Text className="mt-0.5 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {aadhaarFront?.name ?? 'PNG, JPG only'}
                </Text>
              </View>
              <Text className="text-xs font-semibold text-primary">
                {pickingSide === 'front'
                  ? 'Adding...'
                  : aadhaarFront
                    ? 'Update File'
                    : APP_TEXT.onboarding.identity.aadhaarUploadButton}
              </Text>
            </View>
            {aadhaarFront ? (
              <View
                className="mt-3 overflow-hidden rounded-xl border"
                style={{
                  borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
                }}
              >
                <View className="px-2 pt-2">
                  <Text className="text-[11px] font-semibold" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                    Full Preview
                  </Text>
                </View>
                <Image
                  source={{ uri: aadhaarFront.path }}
                  resizeMode="contain"
                  style={{ width: '100%', height: 220, marginTop: 4, marginBottom: 6 }}
                />
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => {
              if (formDisabled || pickingSide !== null) return;
              void pickAadhaarFile('back');
            }}
            disabled={formDisabled || pickingSide !== null}
            className="rounded-2xl border border-dashed p-3"
            style={{
              borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.trackLight,
            }}
          >
            <View className="flex-row items-center">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
                <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-sm font-semibold text-baseDark dark:text-white">{APP_TEXT.onboarding.identity.aadhaarBackLabel}</Text>
                  <Text className="ml-1 text-sm font-semibold" style={{ color: theme.colors.negative }}>*</Text>
                </View>
                <Text className="mt-0.5 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {aadhaarBack?.name ?? 'PNG, JPG only'}
                </Text>
              </View>
              <Text className="text-xs font-semibold text-primary">
                {pickingSide === 'back'
                  ? 'Adding...'
                  : aadhaarBack
                    ? 'Update File'
                    : APP_TEXT.onboarding.identity.aadhaarUploadButton}
              </Text>
            </View>
            {aadhaarBack ? (
              <View
                className="mt-3 overflow-hidden rounded-xl border"
                style={{
                  borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
                }}
              >
                <View className="px-2 pt-2">
                  <Text className="text-[11px] font-semibold" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                    Full Preview
                  </Text>
                </View>
                <Image
                  source={{ uri: aadhaarBack.path }}
                  resizeMode="contain"
                  style={{ width: '100%', height: 220, marginTop: 4, marginBottom: 6 }}
                />
              </View>
            ) : null}
          </Pressable>
        </View>

        <Text className="mt-5 text-sm font-semibold text-baseDark dark:text-white">{APP_TEXT.onboarding.identity.genderLabel}</Text>
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
        <Button label={APP_TEXT.onboarding.identity.nextButton} onPress={onContinue} loading={loading} disabled={loading} />
      </View>
    </GradientScreen>
  );
}
