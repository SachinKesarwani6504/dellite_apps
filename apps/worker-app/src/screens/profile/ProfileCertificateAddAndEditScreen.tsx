import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createWorkerCertificates, getWorkerStatus } from '@/actions';
import { AppSpinner } from '@/components/common/AppSpinner';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { FileUploadCard } from '@/components/common/FileUploadCard';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { ProfileStackParamList } from '@/types/navigation';
import { WorkerCertificateCard, WorkerCertificateWriteItem } from '@/types/auth';
import { SelectedCertificateFile } from '@/types/onboarding';
import { PROFILE_SCREENS } from '@/types/screen-names';
import {
  getCertificateCardId,
  isLockedCertificate,
  resolveCertificateWorkerSkillIds,
  titleCase,
  toWorkerCertificateWriteItem,
} from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';
import { showError } from '@/utils/toast';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.certificateManager>;

function pickCertificateType(card: WorkerCertificateCard, selectedTypeByCard: Record<string, string>) {
  const cardId = getCertificateCardId(card);
  return selectedTypeByCard[cardId] ?? '';
}

function isSupportedCertificateFile(name: string, mimeType?: string | null) {
  const normalizedMime = (mimeType ?? '').toLowerCase();
  const normalizedName = name.toLowerCase();
  if (normalizedMime === 'application/pdf') return true;
  if (normalizedMime.startsWith('image/')) {
    return /\.(png|jpe?g)$/i.test(normalizedName);
  }
  return /\.(pdf|png|jpe?g)$/i.test(normalizedName);
}

export function ProfileCertificateAddAndEditScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [screenLoading, setScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickingCardId, setPickingCardId] = useState<string | null>(null);
  const [certificatesLoadError, setCertificatesLoadError] = useState(false);
  const [requiredCertificates, setRequiredCertificates] = useState<WorkerCertificateCard[]>([]);
  const [selectedTypeByCard, setSelectedTypeByCard] = useState<Record<string, string>>({});
  const [selectedFileByCard, setSelectedFileByCard] = useState<Record<string, SelectedCertificateFile>>({});

  const loadCertificates = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setScreenLoading(true);
      } else {
        setRefreshing(true);
      }

      const status = await getWorkerStatus<{
        certificates?: WorkerCertificateCard[];
        requiredCertificates?: WorkerCertificateCard[];
      }>();
      const certificates = Array.isArray(status.certificates)
        ? status.certificates
        : (Array.isArray(status.requiredCertificates) ? status.requiredCertificates : []);
      setRequiredCertificates(certificates);
      setCertificatesLoadError(false);
      setSelectedTypeByCard(prev => {
        const next: Record<string, string> = {};
        certificates.forEach(card => {
          const cardId = getCertificateCardId(card);
          const existing = prev[cardId];
          if (existing && (card.allowedCertificateTypes ?? []).includes(existing)) {
            next[cardId] = existing;
          }
        });
        return next;
      });
    } catch {
      setCertificatesLoadError(true);
      showError('Failed to load required certificates. Pull to refresh and try again.');
    } finally {
      setScreenLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCertificates(true);
  }, [loadCertificates]);

  const onRefresh = useCallback(() => {
    if (screenLoading || isSubmitting) return;
    void loadCertificates(false);
  }, [isSubmitting, loadCertificates, screenLoading]);

  const onPickFile = async (card: WorkerCertificateCard) => {
    const cardId = getCertificateCardId(card);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ['image/*', 'application/pdf'],
      });

      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }

      const asset = picked.assets[0];
      if (!isSupportedCertificateFile(asset.name ?? '', asset.mimeType)) {
        return;
      }
      const fileType = asset.mimeType ?? (asset.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      setPickingCardId(cardId);
      setSelectedFileByCard(prev => ({
        ...prev,
        [cardId]: {
          name: asset.name ?? `certificate-${Date.now()}`,
          type: fileType,
          url: asset.uri,
        },
      }));
    } catch {
      showError('File selection failed. Please try again.');
    } finally {
      setPickingCardId(null);
    }
  };

  const cardsNeedingUpload = useMemo(
    () => requiredCertificates.filter(card => !isLockedCertificate(card)),
    [requiredCertificates],
  );

  const readyCertificates = cardsNeedingUpload
    .map(card => {
      const cardId = getCertificateCardId(card);
      const selectedType = pickCertificateType(card, selectedTypeByCard);
      const selectedFile = selectedFileByCard[cardId];
      if (!selectedType || !selectedFile || resolveCertificateWorkerSkillIds(card).length === 0) {
        return null;
      }
      return toWorkerCertificateWriteItem({
        card,
        certificateType: selectedType,
        file: selectedFile,
      });
    })
    .filter((item): item is WorkerCertificateWriteItem => Boolean(item));

  const allCardsLocked = requiredCertificates.length > 0 && cardsNeedingUpload.length === 0;
  const canSaveCertificates = readyCertificates.length > 0;

  const onSaveCertificates = async () => {
    if (isSubmitting || !canSaveCertificates) return;
    setIsSubmitting(true);
    try {
      await createWorkerCertificates({ certificates: readyCertificates });
      setSelectedFileByCard({});
      setSelectedTypeByCard({});
      await loadCertificates(false);
    } catch {
      // Backend toast is shown by action layer.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GradientScreen
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
      <View className="flex-row items-center">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>

      <View className="mt-3">
        <SplitGradientTitle
          prefix={APP_TEXT.profile.certificates.titlePrefix}
          highlight={APP_TEXT.profile.certificates.titleHighlight}
          subtitle={APP_TEXT.profile.certificates.subtitle}
          prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
          highlightClassName="text-4xl font-extrabold leading-[40px]"
          subtitleClassName="mt-2 text-sm"
          showSparkle={false}
        />
      </View>
      <Pressable
        onPress={() => navigation.navigate(PROFILE_SCREENS.skillManager)}
        className="mt-3 flex-row items-center justify-center rounded-xl px-3 py-2.5"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <Ionicons name="add-circle-outline" size={15} color={theme.colors.onPrimary} />
        <Text className="ml-1.5 text-sm font-semibold" style={{ color: theme.colors.onPrimary }}>
          {APP_TEXT.profile.certificates.addSkillButton}
        </Text>
      </Pressable>

      {screenLoading ? (
        <View className="mt-8 items-center justify-center">
          <AppSpinner size="large" color={uiColors.onboarding.loader} />
        </View>
      ) : certificatesLoadError ? (
        <ListErrorState
          containerClassName="mt-4"
          title="Could not load certificates"
          description="Pull to refresh or tap retry."
          onAction={() => {
            void loadCertificates(false);
          }}
        />
      ) : requiredCertificates.length === 0 ? (
        <ListEmptyState
          containerClassName="mt-4"
          icon="ribbon-outline"
          title={APP_TEXT.profile.certificates.emptyState}
          description="Add a new skill to see certificate requirements."
          actionLabel={APP_TEXT.profile.certificates.addSkillButton}
          onAction={() => navigation.navigate(PROFILE_SCREENS.skillManager)}
        />
      ) : (
        <View className="mt-4 gap-3">
          {allCardsLocked ? (
            <View className="rounded-2xl border px-4 py-3" style={{ borderColor: theme.colors.accent, backgroundColor: uiColors.surface.accentSoft20 }}>
              <View className="flex-row items-start">
                <View className="mr-2 mt-0.5 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.onPrimary }}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                    {APP_TEXT.profile.certificates.waitingTitle}
                  </Text>
                  <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {APP_TEXT.profile.certificates.waitingSubtitle}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {requiredCertificates.map(item => {
            const cardId = getCertificateCardId(item);
            const selectedType = selectedTypeByCard[cardId] ?? '';
            const isViewOnly = isLockedCertificate(item);
            const isPicking = pickingCardId === cardId;
            const selectedFile = selectedFileByCard[cardId];
            const cardBusy = isSubmitting || isPicking;

            return (
              <View
                key={cardId}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-bold text-baseDark dark:text-white">{item.title ?? 'Certificate'}</Text>
                    {!!item.description ? (
                      <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
                </View>

                <Text className="mt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                  Linked Skills
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {(item.serviceNames ?? []).map((serviceName, chipIndex) => (
                    <View key={`${cardId}-service-${chipIndex}`} className="rounded-full px-2.5 py-1" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
                      <Text className="text-[10px] font-semibold" style={{ color: theme.colors.primary }}>{titleCase(serviceName)}</Text>
                    </View>
                  ))}
                </View>

                {!isViewOnly ? (
                  <>
                    <View className="mt-3 flex-row items-center">
                      <Text className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                        Certificate Type
                      </Text>
                      <Text className="ml-1 text-[10px] font-semibold" style={{ color: theme.colors.negative }}>*</Text>
                    </View>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {(item.allowedCertificateTypes ?? []).map((type, typeIndex) => {
                        const isSelected = selectedType === type;
                        return (
                          <Pressable
                            key={`${cardId}-type-${typeIndex}`}
                            onPress={() => {
                              if (cardBusy) return;
                              setSelectedTypeByCard(prev => ({ ...prev, [cardId]: type }));
                            }}
                            disabled={cardBusy}
                            className="rounded-full border px-2.5 py-1"
                            style={{
                              borderColor: isSelected
                                ? theme.colors.primary
                                : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                              backgroundColor: isSelected
                                ? uiColors.surface.accentSoft20
                                : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight),
                            }}
                          >
                            <Text className="text-[10px] font-semibold" style={{ color: isSelected ? theme.colors.primary : (isDark ? palette.dark.text : palette.light.text) }}>
                              {titleCase(type)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <FileUploadCard
                      files={selectedFile ? [selectedFile] : []}
                      onPress={() => {
                        void onPickFile(item);
                      }}
                      disabled={cardBusy}
                      isPicking={isPicking}
                      isDark={isDark}
                      multiple={false}
                      isRequired
                    />
                  </>
                ) : (
                  <View className="mt-3 rounded-xl border px-3 py-3" style={{ borderColor: theme.colors.accent, backgroundColor: uiColors.surface.accentSoft20 }}>
                    <View className="flex-row items-start">
                      <View className="mr-2 mt-0.5 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.onPrimary }}>
                        <Ionicons
                          name={item.certificateStatus === 'APPROVED' ? 'checkmark-circle-outline' : 'time-outline'}
                          size={15}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                          {item.certificateStatus === 'APPROVED' ? 'Certificate verified' : 'Verification pending'}
                        </Text>
                        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                          {item.certificateStatus === 'APPROVED'
                            ? 'Your certificate is approved.'
                            : 'Certificate submitted successfully. Admin review is in progress.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {!allCardsLocked && requiredCertificates.length > 0 ? (
        <View className="mt-4">
          <Button
            label={APP_TEXT.profile.certificates.saveButton}
            onPress={onSaveCertificates}
            loading={isSubmitting}
            disabled={!canSaveCertificates || isSubmitting}
          />
        </View>
      ) : null}
    </GradientScreen>
  );
}
