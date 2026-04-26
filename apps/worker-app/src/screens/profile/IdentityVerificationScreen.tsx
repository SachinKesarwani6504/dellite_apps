import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getUserAadhar, updateUserAadhar } from '@/actions';
import { AadhaarUploadInput } from '@/components/common/AadhaarUploadInput';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { AppImage } from '@/components/common/AppImage';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { UserAadharData } from '@/types/auth';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';
import { showError } from '@/utils/toast';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.identityVerification>;
type SelectedAadhaarFile = { uri: string; name: string; type: string };

const AADHAAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

function normalizeStatusLabel(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) return 'PENDING';
  return value.trim().replace(/_/g, ' ');
}

function statusColor(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'APPROVED') return theme.colors.positive;
  if (normalized === 'REJECTED') return theme.colors.negative;
  return theme.colors.caution;
}

function extractFileUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const candidate = raw.url;
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return null;
}

export function IdentityVerificationScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const [aadhar, setAadhar] = useState<UserAadharData | null>(null);
  const [frontFile, setFrontFile] = useState<SelectedAadhaarFile | null>(null);
  const [backFile, setBackFile] = useState<SelectedAadhaarFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pickingSide, setPickingSide] = useState<'front' | 'back' | null>(null);

  const loadAadhar = useCallback(async () => {
    const next = await getUserAadhar();
    setAadhar(next);
    return next;
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void loadAadhar()
      .catch(() => {
        // Toasts are handled in API layer.
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadAadhar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAadhar();
    } finally {
      setRefreshing(false);
    }
  }, [loadAadhar]);

  const status = normalizeStatusLabel(aadhar?.status);
  const statusTone = statusColor(status);
  const isRejected = status.trim().toUpperCase() === 'REJECTED';
  const frontUrl = extractFileUrl(aadhar?.aadharFrontFile);
  const backUrl = extractFileUrl(aadhar?.aadharBackFile);
  const cardStyle = useMemo(
    () => ({
      backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
      borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
    }),
    [isDark],
  );

  const pickAadhaarFile = async (side: 'front' | 'back') => {
    if (isUploading) return;
    try {
      setPickingSide(side);
      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ['image/png', 'image/jpeg'],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      if (typeof asset.size === 'number' && asset.size > AADHAAR_MAX_SIZE_BYTES) {
        showError('Aadhaar file size must be 5MB or less.');
        return;
      }
      const nextFile: SelectedAadhaarFile = {
        uri: asset.uri,
        name: asset.name ?? `aadhaar-${side}-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      };
      if (side === 'front') {
        setFrontFile(nextFile);
      } else {
        setBackFile(nextFile);
      }
    } catch {
      showError('Could not pick file. Please try again.');
    } finally {
      setPickingSide(null);
    }
  };

  const onUploadDocuments = async () => {
    if (!frontFile && !backFile) {
      showError('Please upload Aadhaar front or back document.');
      return;
    }
    setIsUploading(true);
    try {
      await updateUserAadhar({
        aadharFront: frontFile ? { uri: frontFile.uri, name: frontFile.name, type: frontFile.type } : undefined,
        aadharBack: backFile ? { uri: backFile.uri, name: backFile.name, type: backFile.type } : undefined,
      });
      setFrontFile(null);
      setBackFile(null);
      await loadAadhar();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ paddingHorizontal: APP_LAYOUT.screenHorizontalPadding, paddingBottom: 20, paddingTop: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void onRefresh(); }} />}
    >
      <View className="mb-3">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>

      <View className="mb-4">
        <SplitGradientTitle
          eyebrow={APP_TEXT.profile.identityVerification.step}
          prefix={APP_TEXT.profile.identityVerification.titlePrefix}
          highlight={APP_TEXT.profile.identityVerification.titleHighlight}
          subtitle={APP_TEXT.profile.identityVerification.subtitle}
          prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
          highlightClassName="text-4xl font-extrabold leading-[40px]"
          subtitleClassName="mt-2 text-sm"
          showSparkle={false}
        />
      </View>

    
        <View
          className="mb-3 flex-row items-center justify-between rounded-xl border px-3 py-3"
          style={{
            borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.accentSoft20,
          }}
        >
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.accentSoft20 }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={statusTone} />
            </View>
            <Text className="ml-3 text-base font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
              {APP_TEXT.profile.identityVerification.menuTitle}
            </Text>
          </View>
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.accentSoft20, borderWidth: 1, borderColor: statusTone }}>
            <Text className="text-[11px] font-semibold" style={{ color: statusTone }}>{status}</Text>
          </View>
        </View>

        {isRejected ? (
          <View className="mb-3 rounded-xl border px-3 py-2" style={{ borderColor: theme.colors.caution, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight }}>
            <Text className="text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {APP_TEXT.profile.identityVerification.rejectedHint}
            </Text>
          </View>
        ) : null}

        <View className="rounded-xl border p-3" style={cardStyle}>
          <Text className="text-sm font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
            {APP_TEXT.profile.identityVerification.aadhaarFrontTitle}
          </Text>
          {isRejected ? (
            <View className="mt-2">
              <AadhaarUploadInput
                label={APP_TEXT.profile.identityVerification.aadhaarFrontTitle}
                required
                fileName={frontFile?.name ?? null}
                previewUri={frontFile?.uri ?? null}
                showPreview
                isLoading={pickingSide === 'front'}
                disabled={isUploading || loading}
                iconName="document-attach-outline"
                onPress={() => {
                  void pickAadhaarFile('front');
                }}
              />
            </View>
          ) : (
            <View className="mt-2 overflow-hidden rounded-xl">
              {frontUrl ? (
                <AppImage source={{ uri: frontUrl }} resizeMode="contain" style={{ width: '100%', height: 220 }} />
              ) : (
                <View className="h-36 items-center justify-center px-4">
                  <Ionicons name="document-outline" size={22} color={theme.colors.primary} />
                  <Text className="mt-2 text-center text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {APP_TEXT.profile.identityVerification.noFile}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="mt-3 rounded-xl border p-3" style={cardStyle}>
          <Text className="text-sm font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
            {APP_TEXT.profile.identityVerification.aadhaarBackTitle}
          </Text>
          {isRejected ? (
            <View className="mt-2">
              <AadhaarUploadInput
                label={APP_TEXT.profile.identityVerification.aadhaarBackTitle}
                required
                fileName={backFile?.name ?? null}
                previewUri={backFile?.uri ?? null}
                showPreview
                isLoading={pickingSide === 'back'}
                disabled={isUploading || loading}
                iconName="document-text-outline"
                onPress={() => {
                  void pickAadhaarFile('back');
                }}
              />
            </View>
          ) : (
            <View className="mt-2 overflow-hidden rounded-xl">
              {backUrl ? (
                <AppImage source={{ uri: backUrl }} resizeMode="contain" style={{ width: '100%', height: 220 }} />
              ) : (
                <View className="h-36 items-center justify-center px-4">
                  <Ionicons name="document-outline" size={22} color={theme.colors.primary} />
                  <Text className="mt-2 text-center text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {APP_TEXT.profile.identityVerification.noFile}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

      {isRejected ? (
        <View className="mt-4">
          <Button
            label={APP_TEXT.profile.identityVerification.uploadButton}
            onPress={() => {
              void onUploadDocuments();
            }}
            loading={isUploading}
            disabled={isUploading || (!frontFile && !backFile) || loading}
          />
        </View>
      ) : null}
    </GradientScreen>
  );
}
