import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, Text, View, useColorScheme } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { updateWorkerProfile } from "@/actions";
import { AppInput } from "@/components/common/AppInput";
import { BackButton } from "@/components/common/BackButton";
import { useBrandRefreshControlProps } from "@/components/common/BrandRefreshControl";
import { Button } from "@/components/common/Button";
import { GradientScreen } from "@/components/common/GradientScreen";
import { ProfilePhotoUploadPlaceholder } from "@/components/common/ProfilePhotoUploadPlaceholder";
import { SplitGradientTitle } from "@/components/common/SplitGradientTitle";
import { useAuthContext } from "@/contexts/AuthContext";
import { Gender } from "@/types/auth";
import { ProfileStackParamList } from "@/types/navigation";
import { PROFILE_SCREENS } from "@/types/screen-names";
import { APP_TEXT } from "@/utils/appText";
import { APP_LAYOUT } from "@/utils/layout";
import { GENDER_OPTIONS } from "@/utils/options";
import { palette, theme, uiColors } from "@/utils/theme";
import { showError } from "@/utils/toast";
import { extractImageUrl, formatTitle } from "@/utils";
import {
  isValidFirstName,
  isValidLastName,
  normalizePersonName,
} from "@/utils/validation";

type Props = NativeStackScreenProps<
  ProfileStackParamList,
  typeof PROFILE_SCREENS.editProfile
>;
const genderOptions = Array.isArray(GENDER_OPTIONS) ? GENDER_OPTIONS : [];
const PROFILE_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function EditProfileScreen({ navigation }: Props) {
  const isDark = useColorScheme() === "dark";
  const { user, refreshMe } = useAuthContext();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { modeKey, refreshProps } = useBrandRefreshControlProps();

  useEffect(() => {
    setFirstName(String(user?.firstName ?? ""));
    setLastName(String(user?.lastName ?? ""));
    setEmail(String(user?.email ?? ""));
    if (
      user?.gender === "MALE" ||
      user?.gender === "FEMALE" ||
      user?.gender === "OTHER"
    ) {
      setGender(user.gender);
    }
    const userCities = Array.isArray(
      (user as { workerOperatingCities?: unknown })?.workerOperatingCities,
    )
      ? ((user as { workerOperatingCities?: unknown[] })
          .workerOperatingCities ?? [])
      : [];
    const normalizedCities = userCities
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
      .map((value) => value.trim().toUpperCase());
    setSelectedCities(normalizedCities);
  }, [user?.email, user?.firstName, user?.gender, user?.lastName]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMe();
    } finally {
      setRefreshing(false);
    }
  };
  const existingProfileImageUrl = (() => {
    const rawUser = user as Record<string, unknown> | null | undefined;
    return (
      extractImageUrl(rawUser?.profileImage) ??
      extractImageUrl(rawUser?.profile_image) ??
      (typeof rawUser?.profileImageUrl === "string"
        ? rawUser.profileImageUrl
        : null) ??
      (typeof rawUser?.profile_image_url === "string"
        ? rawUser.profile_image_url
        : null)
    );
  })();

  const isValid = isValidFirstName(firstName) && isValidLastName(lastName);

  const onPickProfileImage = async () => {
    if (saving) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ["image/png", "image/jpeg"],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      if (
        typeof asset.size === "number" &&
        asset.size > PROFILE_IMAGE_MAX_SIZE_BYTES
      ) {
        showError("Profile image size must be 2MB or less.");
        return;
      }
      setProfileImage({
        uri: asset.uri,
        name: asset.name ?? `profile-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
    } catch {
      showError("Could not pick profile image. Please try again.");
    }
  };

  const onSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await updateWorkerProfile({
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        email: email.trim() || undefined,
        gender,
        workerOperatingCities: selectedCities,
        profileImage: profileImage ?? undefined,
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
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 20,
        paddingHorizontal: APP_LAYOUT.screenHorizontalPadding,
      }}
      refreshControl={
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          {...refreshProps}
        />
      }
    >
      <View className="mb-3">
        <BackButton
          onPress={() => navigation.goBack()}
          visible={navigation.canGoBack()}
        />
      </View>

      <View
        className="rounded-3xl pb-6 pt-4"
        style={{
          backgroundColor: isDark
            ? uiColors.surface.cardElevatedDark
            : palette.light.card,
        }}
      >
        <SplitGradientTitle
          eyebrow={APP_TEXT.profile.edit.step}
          prefix={APP_TEXT.profile.edit.titlePrefix}
          highlight={APP_TEXT.profile.edit.titleGradientWord}
          subtitle={APP_TEXT.profile.edit.subtitle}
        />

        <View className="mt-5">
          <ProfilePhotoUploadPlaceholder
            title={APP_TEXT.onboarding.identity.uploadPhotoTitle}
            subtitle={`${APP_TEXT.onboarding.identity.uploadPhotoSubtitle} - Max 2MB`}
            imageUri={profileImage?.uri ?? existingProfileImageUrl}
            onPress={() => {
              void onPickProfileImage();
            }}
          />
        </View>

        <View className="mt-6 gap-3">
          <AppInput
            label={APP_TEXT.onboarding.identity.firstNameLabel}
            isRequired
            value={firstName}
            onChangeText={(value) => setFirstName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.firstNamePlaceholder}
            editable={!saving}
          />
          <AppInput
            label={APP_TEXT.onboarding.identity.lastNameLabel}
            isRequired
            value={lastName}
            onChangeText={(value) => setLastName(normalizePersonName(value))}
            placeholder={APP_TEXT.onboarding.identity.lastNamePlaceholder}
            editable={!saving}
          />
          <AppInput
            label={APP_TEXT.profile.emailLabel}
            value={email}
            onChangeText={setEmail}
            placeholder={APP_TEXT.profile.edit.emailPlaceholder}
            keyboardType="email-address"
            editable={!saving}
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
                  if (saving) return;
                  setGender(option.value);
                }}
                disabled={saving}
                className={`flex-1 rounded-2xl border p-3 ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-accent/40 bg-white dark:border-white/10"
                }`}
                style={
                  !selected
                    ? {
                        backgroundColor: isDark
                          ? uiColors.surface.cardMutedDark
                          : palette.light.card,
                      }
                    : undefined
                }
              >
                <Text className="text-center text-2xl">{option.icon}</Text>
                <Text
                  className={`mt-1 text-center text-sm font-semibold ${
                    selected ? "text-primary" : "text-baseDark dark:text-white"
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
            <Text className="text-sm font-semibold text-baseDark dark:text-white">
              Operating Cities
            </Text>
            <Text
              className="ml-1 text-sm font-semibold"
              style={{ color: theme.colors.negative }}
            >
              *
            </Text>
          </View>
          <Text
            className="mt-1 text-xs"
            style={{
              color: isDark
                ? uiColors.text.subtitleDark
                : uiColors.text.subtitleLight,
            }}
          >
            Cities shown below are from your profile data.
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {selectedCities.map((cityName) => {
              const selected = selectedCities.includes(cityName);
              return (
                <Pressable
                  key={cityName}
                  onPress={() => {
                    if (saving) return;
                    setSelectedCities((current) =>
                      current.includes(cityName)
                        ? current.filter((value) => value !== cityName)
                        : [...current, cityName],
                    );
                  }}
                  disabled={saving}
                  className="rounded-full border px-3 py-2"
                  style={{
                    borderColor: selected
                      ? theme.colors.primary
                      : isDark
                        ? uiColors.surface.overlayDark14
                        : uiColors.surface.borderNeutralLight,
                    backgroundColor: selected
                      ? isDark
                        ? uiColors.surface.overlayDark10
                        : uiColors.surface.accentSoft20
                      : isDark
                        ? uiColors.surface.cardMutedDark
                        : palette.light.card,
                  }}
                >
                  <Text
                    className={`text-xs font-semibold ${selected ? "text-primary" : "text-baseDark dark:text-white"}`}
                  >
                    {formatTitle(cityName)}
                  </Text>
                </Pressable>
              );
            })}
            {selectedCities.length === 0 ? (
              <Text
                className="text-xs"
                style={{
                  color: isDark
                    ? uiColors.text.subtitleDark
                    : uiColors.text.subtitleLight,
                }}
              >
                No operating cities found in profile.
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View className="mt-5">
        <Button
          label={APP_TEXT.profile.edit.saveButton}
          onPress={onSave}
          loading={saving}
          disabled={!isValid || saving}
        />
      </View>
    </GradientScreen>
  );
}
