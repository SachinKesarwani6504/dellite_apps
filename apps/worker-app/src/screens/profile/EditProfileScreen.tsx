import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View, useColorScheme } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { updateWorkerProfile } from "@/actions";
import { AppInput } from "@/components/common/AppInput";
import { useBrandRefreshControlProps } from "@/components/common/BrandRefreshControl";
import { Button } from "@/components/common/Button";
import { DetailsTopBar } from "@/components/common/DetailsTopBar";
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
  const { user, me, refreshMe } = useAuthContext();
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
  const roleLink = (me as Record<string, unknown> | null | undefined)?.roleLink as Record<string, unknown> | undefined;

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
    const roleLinkCities = Array.isArray(roleLink?.workerOperatingCities)
      ? roleLink.workerOperatingCities
      : [];
    const fallbackUserCities = Array.isArray(
      (user as { workerOperatingCities?: unknown })?.workerOperatingCities,
    )
      ? ((user as { workerOperatingCities?: unknown[] }).workerOperatingCities ?? [])
      : [];
    const userCities = roleLinkCities.length > 0 ? roleLinkCities : fallbackUserCities;
    const normalizedCities = userCities
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
      .map((value) => value.trim().toUpperCase());
    setSelectedCities(normalizedCities);
  }, [roleLink?.workerOperatingCities, user?.email, user?.firstName, user?.gender, user?.lastName]);

  const availableCityNames = useMemo(() => {
    const launchedCityCandidates = Array.isArray(roleLink?.lauchedCities)
      ? roleLink?.lauchedCities
      : (Array.isArray(roleLink?.launchedCities) ? roleLink?.launchedCities : []);
    const fromOptions = launchedCityCandidates
      .filter((cityName): cityName is string => typeof cityName === "string")
      .map((cityName) => cityName.trim().toUpperCase())
      .filter((cityName) => cityName.length > 0);
    const merged = [...fromOptions];
    selectedCities.forEach((cityName) => {
      if (!merged.includes(cityName)) {
        merged.push(cityName);
      }
    });
    return merged;
  }, [me, selectedCities]);

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

  const isValid = isValidFirstName(firstName) && isValidLastName(lastName) && selectedCities.length > 0;

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
      const payload = {
        firstName: normalizePersonName(firstName).trim(),
        lastName: normalizePersonName(lastName).trim(),
        email: email.trim() || undefined,
        gender,
        workerOperatingCities: selectedCities,
        profileImage: profileImage ?? undefined,
      };
      console.log("[EditProfileScreen] updateWorkerProfile Payload:", payload);
      await updateWorkerProfile(payload);
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
      {navigation.canGoBack() ? <DetailsTopBar onBack={() => navigation.goBack()} /> : null}

      <View className="pb-6">
        <SplitGradientTitle
          prefix={APP_TEXT.profile.edit.titlePrefix}
          highlight={APP_TEXT.profile.edit.titleGradientWord}
          subtitle={APP_TEXT.profile.edit.subtitle}
        />

        <View className="mt-5">
          <ProfilePhotoUploadPlaceholder
            title={APP_TEXT.onboarding.identity.uploadPhotoTitle}
            subtitle={APP_TEXT.onboarding.identity.uploadPhotoSubtitle}
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
            Select at least one city where you can work.
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {availableCityNames.map((cityName) => {
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
