import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getServiceLaunchedCities } from '@/actions';
import { AadhaarUploadInput } from '@/components/common/AadhaarUploadInput';
import { AppInput } from '@/components/common/AppInput';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfilePhotoUploadPlaceholder } from '@/components/common/ProfilePhotoUploadPlaceholder';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Gender, ServiceLaunchedCity } from '@/types/auth';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { GENDER_OPTIONS } from '@/utils/options';
import { palette, theme, uiColors } from '@/utils/theme';
import { getOnboardingPhoneToken } from '@/utils/key-chain-storage';
import { stripBearerPrefix } from '@/utils/token';
import { showError } from '@/utils/toast';
import { isValidFirstName, isValidLastName, normalizePersonName } from '@/utils/validation';
import { formatTitle } from '@/utils';

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

function logOnboardingIdentityScreen(step: string, payload?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[onboarding-identity-screen] ${step}`, payload);
}

export function OnboardingIdentityScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const { onboardingPrefill, fetchOnboardingPrefill } = useAuthContext();
  const canEdit = onboardingPrefill?.canEdit ?? {};
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [profileImage, setProfileImage] = useState<ProfileImageSelection | null>(null);
  const [existingProfileImageUrl, setExistingProfileImageUrl] = useState<string | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<AadhaarFileSelection | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<AadhaarFileSelection | null>(null);
  const [pickingSide, setPickingSide] = useState<'front' | 'back' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityOptions, setCityOptions] = useState<ServiceLaunchedCity[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityLoadError, setCityLoadError] = useState<string | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const didRunInitialRouteCheckRef = useRef(false);
  const didRequestPrefillRef = useRef(false);
  const {
    completeIdentityProfile,
    loading,
    getOnboardingRedirect,
    refreshOnboardingRoute,
  } = useOnboardingContext();
  const formDisabled = loading || isSubmitting;

  const refreshPrefill = async () => {
    const token = await getOnboardingPhoneToken();
    const normalizedToken = token ? stripBearerPrefix(token) : '';
    if (!normalizedToken) {
      showError('Session expired. Please verify OTP again.');
      return;
    }

    try {
      await fetchOnboardingPrefill(normalizedToken);
    } catch {
      showError('Couldn’t fetch prefill. Please enter details manually.');
    }
  };
  const { refreshing, onRefresh } = usePullToRefresh(refreshPrefill);

  useEffect(() => {
    if (didRequestPrefillRef.current) return;
    didRequestPrefillRef.current = true;

    const requestPrefill = async () => {
      const token = await getOnboardingPhoneToken();
      const normalizedToken = token ? stripBearerPrefix(token) : '';
      if (!normalizedToken) return;

      try {
        await fetchOnboardingPrefill(normalizedToken);
      } catch {
        // Non-blocking: user can still enter details manually.
      }
    };

    void requestPrefill();
  }, [fetchOnboardingPrefill]);

  useEffect(() => {
    if (didRunInitialRouteCheckRef.current) return;
    didRunInitialRouteCheckRef.current = true;

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
    if (!onboardingPrefill) return;

    if (typeof onboardingPrefill.firstName === 'string' && onboardingPrefill.firstName.trim().length > 0) {
      setFirstName(normalizePersonName(onboardingPrefill.firstName));
    }
    if (typeof onboardingPrefill.lastName === 'string' && onboardingPrefill.lastName.trim().length > 0) {
      setLastName(normalizePersonName(onboardingPrefill.lastName));
    }
    if (typeof onboardingPrefill.email === 'string' && onboardingPrefill.email.trim().length > 0) {
      setEmail(onboardingPrefill.email.trim());
    }
    if (
      onboardingPrefill.gender === 'MALE'
      || onboardingPrefill.gender === 'FEMALE'
      || onboardingPrefill.gender === 'OTHER'
    ) {
      setGender(onboardingPrefill.gender);
    }
    if (typeof onboardingPrefill.profileImage?.url === 'string' && onboardingPrefill.profileImage.url.trim().length > 0) {
      setExistingProfileImageUrl(onboardingPrefill.profileImage.url.trim());
    }
  }, [onboardingPrefill]);

  useEffect(() => {
    const redirect = getOnboardingRedirect(ONBOARDING_SCREENS.identity);
    if (redirect) {
      navigation.replace(redirect);
    }
  }, [getOnboardingRedirect, navigation]);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      if (!mounted) return;
      setCityLoading(true);
      setCityLoadError(null);
      try {
        const cities = await getServiceLaunchedCities();
        if (!mounted) return;
        setCityOptions(cities);
      } catch {
        if (!mounted) return;
        setCityOptions([]);
        setCityLoadError('Could not load operating cities. Please retry.');
      } finally {
        if (!mounted) return;
        setCityLoading(false);
      }
    };
    void loadCities();
    return () => {
      mounted = false;
    };
  }, []);

  const isValid = isValidFirstName(firstName)
    && isValidLastName(lastName)
    && Boolean(gender)
    && Boolean(aadhaarFront)
    && Boolean(aadhaarBack)
    && selectedCities.length > 0;

  const onContinue = async () => {
    logOnboardingIdentityScreen('next-clicked', {
      formDisabled,
      loading,
      isSubmitting,
      isValid,
      firstName,
      lastName,
      gender,
      referralCode,
      selectedCities,
      email,
      profileImage,
      aadhaarFront,
      aadhaarBack,
    });
    if (formDisabled) return;
    if (!isValid) {
      logOnboardingIdentityScreen('next-blocked-invalid-form');
      const missingFields: string[] = [];
      if (!isValidFirstName(firstName)) missingFields.push('first name');
      if (!isValidLastName(lastName)) missingFields.push('last name');
      if (!gender) missingFields.push('gender');
      if (selectedCities.length === 0) missingFields.push('at least one operating city');
      if (!aadhaarFront) missingFields.push('Aadhaar front');
      if (!aadhaarBack) missingFields.push('Aadhaar back');
      const message = missingFields.length > 0
        ? `Please add ${missingFields.join(', ')}.`
        : 'Please complete required fields.';
      showError(message);
      return;
    }
    setIsSubmitting(true);
    const submitPayload = {
      firstName: normalizePersonName(firstName).trim(),
      lastName: normalizePersonName(lastName).trim(),
      email: email.trim() || undefined,
      gender: gender ?? undefined,
      workerOperatingCities: selectedCities,
      referralCode: referralCode.trim() || undefined,
      profileImage: profileImage ? { uri: profileImage.uri, name: profileImage.name, type: profileImage.type } : undefined,
      aadhaarFront: aadhaarFront ? { uri: aadhaarFront.path, name: aadhaarFront.name, type: aadhaarFront.type } : undefined,
      aadhaarBack: aadhaarBack ? { uri: aadhaarBack.path, name: aadhaarBack.name, type: aadhaarBack.type } : undefined,
    };
    logOnboardingIdentityScreen('next-submit-payload', submitPayload);
    try {
      await completeIdentityProfile(submitPayload);
      logOnboardingIdentityScreen('next-submit-success');
      navigation.replace(ONBOARDING_SCREENS.serviceSelection);
    } catch (error) {
      logOnboardingIdentityScreen('next-submit-error', error);
      const message = error instanceof Error && error.message.trim().length > 0
        ? error.message
        : 'Could not continue onboarding. Please try again.';
      if (message.includes('We sent a new OTP')) {
        return;
      }
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
    if (formDisabled || canEdit.profileImage === false) return;
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
      keyboardAware
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
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
            imageUri={profileImage?.uri ?? existingProfileImageUrl}
            onPress={canEdit.profileImage === false ? undefined : () => {
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
            editable={!formDisabled && canEdit.firstName !== false}
          />
          <AppInput
            label={APP_TEXT.onboarding.identity.lastNameLabel}
            isRequired
            value={lastName}
            onChangeText={value => setLastName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.lastNamePlaceholder}
            editable={!formDisabled && canEdit.lastName !== false}
          />
          <AppInput
            label={APP_TEXT.profile.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={APP_TEXT.profile.edit.emailPlaceholder}
            keyboardType="email-address"
            editable={!formDisabled && canEdit.email !== false}
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
          {`${APP_TEXT.onboarding.identity.aadhaarUploadHint} - Max 5MB each`}
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
                  if (formDisabled || canEdit.gender === false) return;
                  setGender(option.value);
                }}
                disabled={formDisabled || canEdit.gender === false}
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

        <View className="mt-5">
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-baseDark dark:text-white">Operating Cities</Text>
            <Text className="ml-1 text-sm font-semibold" style={{ color: theme.colors.negative }}>*</Text>
          </View>
          <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            Select at least one city where you can work.
          </Text>
          {cityLoadError ? (
            <View className="mt-2 rounded-xl border px-3 py-2" style={{
              borderColor: theme.colors.negative,
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}>
              <Text className="text-xs font-semibold" style={{ color: theme.colors.negative }}>
                {cityLoadError}
              </Text>
              <Pressable
                className="mt-2 self-start rounded-full border px-3 py-1.5"
                style={{
                  borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
                }}
                onPress={async () => {
                  setCityLoading(true);
                  setCityLoadError(null);
                  try {
                    const cities = await getServiceLaunchedCities();
                    setCityOptions(cities);
                  } catch {
                    setCityOptions([]);
                    setCityLoadError('Could not load operating cities. Please retry.');
                  } finally {
                    setCityLoading(false);
                  }
                }}
              >
                <Text className="text-xs font-semibold text-primary">Retry cities</Text>
              </Pressable>
            </View>
          ) : null}
          {cityLoading ? (
            <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              Loading cities...
            </Text>
          ) : null}
          <View className="mt-2 flex-row flex-wrap gap-2">
            {cityOptions.map(city => {
              const cityName = city.name.trim().toUpperCase();
              const selected = selectedCities.includes(cityName);
              return (
                <Pressable
                  key={city.id}
                  onPress={() => {
                    if (formDisabled) return;
                    setSelectedCities(current => (
                      current.includes(cityName)
                        ? current.filter(value => value !== cityName)
                        : [...current, cityName]
                    ));
                  }}
                  disabled={formDisabled}
                  className="rounded-full border px-3 py-2"
                  style={{
                    borderColor: selected ? theme.colors.primary : (isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight),
                    backgroundColor: selected
                      ? (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20)
                      : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
                  }}
                >
                  <Text className={`text-xs font-semibold ${selected ? 'text-primary' : 'text-baseDark dark:text-white'}`}>
                    {formatTitle(cityName)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View className="mt-5">
        <Button label={APP_TEXT.onboarding.identity.nextButton} onPress={onContinue} loading={isSubmitting} disabled={formDisabled} />
      </View>
    </GradientScreen>
  );
}
