import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AadhaarUploadInput } from '@/components/common/AadhaarUploadInput';
import { Button } from '@/components/common/Button';
import { AppInput } from '@/components/common/AppInput';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfilePhotoUploadPlaceholder } from '@/components/common/ProfilePhotoUploadPlaceholder';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { Gender } from '@/types/auth';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
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

const genderOptions = Array.isArray(GENDER_OPTIONS) ? GENDER_OPTIONS : [];
type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ONBOARDING_SCREENS.identity>;
type AadhaarFileSelection = {
  path: string;
  name: string;
  type: string;
};

type ProfileImageSelection = {
  uri: string;
  name: string;
  type: string;
};

const PROFILE_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const AADHAAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function OnboardingIdentityScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [profileImage, setProfileImage] = useState<ProfileImageSelection | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<AadhaarFileSelection | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<AadhaarFileSelection | null>(null);
  const [pickingSide, setPickingSide] = useState<'front' | 'back' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    completeIdentityProfile,
    loading,
    getOnboardingRedirect,
    refreshOnboardingRoute,
  } = useOnboardingContext();
  const formDisabled = loading || isSubmitting;

  useEffect(() => {
    void refreshOnboardingRoute(true)
      .then(route => {
        if (route !== ONBOARDING_SCREENS.identity) {
          navigation.replace(route);
        }
      })
      .catch(() => {
        // Existing onboarding route in context still guards the current screen.
      });
  }, [navigation, refreshOnboardingRoute]);

  useEffect(() => {
    const redirect = getOnboardingRedirect(ONBOARDING_SCREENS.identity);
    if (redirect) {
      navigation.replace(redirect);
    }
  }, [getOnboardingRedirect, navigation]);

  const isValid = isValidFirstName(firstName)
    && isValidLastName(lastName)
    && Boolean(gender)
    && Boolean(aadhaarFront)
    && Boolean(aadhaarBack);

  const onContinue = async () => {
    if (formDisabled) return;
    if (!isValid) {
      showError('Please enter first name, last name, select gender, and upload Aadhaar front/back.');
      return;
    }
    setIsSubmitting(true);
    try {
      await completeIdentityProfile({
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        gender: gender ?? undefined,
        referralCode: referralCode.trim() || undefined,
        profileImage: profileImage ? { uri: profileImage.uri, name: profileImage.name, type: profileImage.type } : undefined,
        aadhaarFront: aadhaarFront ? { uri: aadhaarFront.path, name: aadhaarFront.name, type: aadhaarFront.type } : undefined,
        aadhaarBack: aadhaarBack ? { uri: aadhaarBack.path, name: aadhaarBack.name, type: aadhaarBack.type } : undefined,
      });
      navigation.replace(ONBOARDING_SCREENS.serviceSelection);
    } catch (error) {
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message
        : 'Could not continue onboarding. Please try again.';
      showError(message);
    } finally {
      setIsSubmitting(false);
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
      if (typeof asset.size === 'number' && asset.size > AADHAAR_MAX_SIZE_BYTES) {
        showError('Aadhaar file size must be 5MB or less.');
        return;
      }
      const selection = {
        path: asset.uri,
        name: fileName,
        type: asset.mimeType ?? 'image/jpeg',
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

  const pickProfileImage = async () => {
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
            subtitle={`${APP_TEXT.onboarding.identity.uploadPhotoSubtitle} â€¢ Max 2MB`}
            imageUri={profileImage?.uri ?? null}
            onPress={() => {
              void pickProfileImage();
            }}
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
          {`${APP_TEXT.onboarding.identity.aadhaarUploadHint} • Max 5MB each`}
        </Text>
        <View className="mt-2 gap-2">
          <AadhaarUploadInput
            label={APP_TEXT.onboarding.identity.aadhaarFrontLabel}
            required
            fileName={aadhaarFront?.name ?? null}
            previewUri={aadhaarFront?.path ?? null}
            isLoading={pickingSide === 'front'}
            disabled={formDisabled || pickingSide !== null}
            iconName="document-attach-outline"
            onPress={() => {
              if (formDisabled || pickingSide !== null) return;
              void pickAadhaarFile('front');
            }}
          />
          <AadhaarUploadInput
            label={APP_TEXT.onboarding.identity.aadhaarBackLabel}
            required
            fileName={aadhaarBack?.name ?? null}
            previewUri={aadhaarBack?.path ?? null}
            isLoading={pickingSide === 'back'}
            disabled={formDisabled || pickingSide !== null}
            iconName="document-text-outline"
            onPress={() => {
              if (formDisabled || pickingSide !== null) return;
              void pickAadhaarFile('back');
            }}
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
        <Button label={APP_TEXT.onboarding.identity.nextButton} onPress={onContinue} loading={isSubmitting} disabled={formDisabled} />
      </View>
    </GradientScreen>
  );
}

