import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AppSpinner } from '@/components/common/AppSpinner';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useOnboarding, useOnboardingScreenGuard } from '@/hooks/useOnboarding';
import { OnboardingStackParamList } from '@/types/navigation';
import { WorkerCertificateCard } from '@/types/auth';
import { SelectedCertificateFile } from '@/types/onboarding';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { titleCase } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingCertification'>;

export function OnboardingCertificationScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const {
    fetchRequiredCertificates,
    submitCertificatesAndResolve,
    syncOnboardingRoute,
    skipCertificateSetup,
  } = useOnboarding();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [screenLoading, setScreenLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [authRefreshError, setAuthRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingCardId, setSubmittingCardId] = useState<string | null>(null);
  const [pickingCardId, setPickingCardId] = useState<string | null>(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const [requiredCertificates, setRequiredCertificates] = useState<WorkerCertificateCard[]>([]);
  const [selectedTypeByCard, setSelectedTypeByCard] = useState<Record<string, string>>({});
  const [selectedFileByCard, setSelectedFileByCard] = useState<Record<string, SelectedCertificateFile>>({});
  const [hasSubmittedThisSession, setHasSubmittedThisSession] = useState(false);
  const formLocked = submittingCardId === '__bulk__' || skipLoading;
  const getCardId = (card: WorkerCertificateCard) =>
    card.latestCertificateId
    ?? card.workerServiceId
    ?? card.serviceId
    ?? `${card.title ?? 'certificate'}-${card.serviceName ?? 'service'}`;

  const loadCertificates = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setScreenLoading(true);
      } else {
        setRefreshing(true);
      }
      setStatusError(null);
      const certificates = await fetchRequiredCertificates();
      setRequiredCertificates(certificates);
      setSelectedTypeByCard(prev => {
        const next: Record<string, string> = {};
        certificates.forEach((card: WorkerCertificateCard) => {
          const cardId = getCardId(card);
          const existing = prev[cardId];
          if (existing && (card.allowedCertificateTypes ?? []).includes(existing)) {
            next[cardId] = existing;
          }
        });
        return next;
      });
    } catch {
      setStatusError('Failed to load required certificates. Pull to refresh and try again.');
    } finally {
      setScreenLoading(false);
      setRefreshing(false);
    }
  }, [fetchRequiredCertificates]);

  useEffect(() => {
    void loadCertificates(true);
  }, [loadCertificates]);

  const onBackStep = () => {
    if (formLocked) return;
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const onRefresh = useCallback(() => {
    if (screenLoading || formLocked) return;
    setAuthRefreshError(null);
    setSelectedFileByCard({});
    setSelectedTypeByCard({});
    setHasSubmittedThisSession(false);
    void Promise.all([
      syncOnboardingRoute().catch(() => {
        setAuthRefreshError('Could not refresh onboarding flags.');
      }),
      loadCertificates(false),
    ]);
  }, [formLocked, loadCertificates, screenLoading, syncOnboardingRoute]);

  useOnboardingScreenGuard({
    currentRoute: ONBOARDING_SCREENS.certification,
    onRedirect: route => navigation.replace(route),
  });

  const onPickFile = async (card: WorkerCertificateCard) => {
    const cardId = getCardId(card);
    setStatusError(null);
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
      setStatusError(null);
    } catch {
      setStatusError('File selection failed. Please try again.');
    } finally {
      setPickingCardId(null);
    }
  };

  const isLockedCertificate = (card: WorkerCertificateCard) =>
    card.certificateStatus === 'PENDING' || card.certificateStatus === 'APPROVED';

  const cardsNeedingUpload = requiredCertificates.filter(card => !isLockedCertificate(card));
  const cardsToSubmit = cardsNeedingUpload;
  const allCardsLocked = requiredCertificates.length > 0 && cardsNeedingUpload.length === 0;
  const showWaitingState = allCardsLocked || hasSubmittedThisSession;

  const canUploadAll = showWaitingState || cardsToSubmit.every(card => {
    const cardId = getCardId(card);
    const selectedFile = selectedFileByCard[cardId];
    return Boolean(selectedFile);
  });

  const onUploadAndContinue = async () => {
    if (formLocked) return;
    setStatusError(null);
    setAuthRefreshError(null);

    if (showWaitingState || cardsToSubmit.length === 0) {
      try {
        await syncOnboardingRoute();
      } catch {
        setAuthRefreshError('Could not refresh onboarding flags.');
      }
      return;
    }

    const createPayload: Array<{
      certificateId?: string;
      certificateType: string;
      serviceIds: string[];
      fileName: string;
      fileType: string;
      fileUrl: string;
    }> = [];
    const updatePayload: Array<{
      certificateId: string;
      certificateType: string;
      serviceIds: string[];
      fileName: string;
      fileType: string;
      fileUrl: string;
    }> = [];

    for (let index = 0; index < cardsToSubmit.length; index += 1) {
      const card = cardsToSubmit[index];
      const cardId = getCardId(card);
      const selectedType =
        selectedTypeByCard[cardId]
        ?? card.latestCertificateType
        ?? card.allowedCertificateTypes?.[0]
        ?? '';
      const selectedFile = selectedFileByCard[cardId];
      if (!selectedFile) {
        setStatusError('Add certificate file for all required cards before continuing.');
        return;
      }
      if (!selectedType) {
        setStatusError('Certificate type is not available for one of the required cards.');
        return;
      }

      const payloadItem = {
        certificateType: selectedType,
        serviceIds: card.serviceIds ?? [],
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileUrl: selectedFile.url,
      };

      if (card.latestCertificateId) {
        updatePayload.push({
          certificateId: card.latestCertificateId,
          ...payloadItem,
        });
      } else {
        createPayload.push({
          certificateId: undefined,
          ...payloadItem,
        });
      }
    }

    setSubmittingCardId('__bulk__');
    try {
      const resolution = await submitCertificatesAndResolve(
        { certificates: createPayload },
        { certificates: updatePayload },
      );

      setHasSubmittedThisSession(true);
      setSelectedFileByCard({});
      setSelectedTypeByCard({});
      await Promise.all([syncOnboardingRoute(), loadCertificates(false)]);
    } catch {
      setStatusError('Certificate upload failed. Please try again.');
    } finally {
      setSubmittingCardId(null);
    }
  };

  const onSkipCertificates = async () => {
    if (formLocked) return;
    setSkipLoading(true);
    try {
      await skipCertificateSetup();
    } finally {
      setSkipLoading(false);
    }
  };
  const showBackButton = navigation.canGoBack();

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 18, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
    >
      <View className="rounded-3xl px-4 pb-5 pt-4" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <View className="flex-row items-center">
          <View className="w-10">
            <BackButton onPress={onBackStep} visible={showBackButton} />
          </View>
          <View className="flex-1" />
          <Pressable
            onPress={() => {
              void onSkipCertificates();
            }}
            disabled={formLocked}
            className={`flex-row items-center rounded-full border px-3 py-1.5 ${formLocked ? 'opacity-60' : ''}`}
            style={{
              borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
            }}
          >
            {skipLoading ? (
              <AppSpinner size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Text className="text-xs font-semibold text-primary">{APP_TEXT.onboarding.certification.skipButton}</Text>
                <Ionicons name="chevron-forward-outline" size={14} color={theme.colors.primary} />
              </>
            )}
          </Pressable>
        </View>
        <Text className="mt-3 text-xs font-bold tracking-widest text-primary">{APP_TEXT.onboarding.certification.step}</Text>
        <Text className="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white">
          {APP_TEXT.onboarding.certification.title}
        </Text>
        <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.onboarding.certification.subtitle}
        </Text>
        {statusError ? (
          <Text className="mt-2 text-xs" style={{ color: theme.colors.negative }}>{statusError}</Text>
        ) : null}
        {authRefreshError ? (
          <Text className="mt-1 text-xs" style={{ color: theme.colors.caution }}>{authRefreshError}</Text>
        ) : null}

        {screenLoading ? (
          <View className="mt-8 items-center justify-center">
            <AppSpinner size="large" color={uiColors.onboarding.loader} />
          </View>
        ) : (
          <View className="mt-4">
            {requiredCertificates.length === 0 ? (
              <View className="rounded-2xl border border-accent/40 bg-surfaceSoft/40 p-4 dark:border-white/10" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.accentSoft40 }}>
                <Text className="text-sm font-semibold text-baseDark dark:text-white">
                  {APP_TEXT.onboarding.certification.noCertificateText}
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {showWaitingState ? (
                  <View className="rounded-2xl border px-4 py-3" style={{ borderColor: theme.colors.accent, backgroundColor: uiColors.surface.accentSoft20 }}>
                    <View className="flex-row items-start">
                      <View className="mr-2 mt-0.5 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.onPrimary }}>
                        <Ionicons name="checkmark-done-outline" size={16} color={theme.colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                          All set. Waiting for approval.
                        </Text>
                        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                          Certificates are submitted. Admin will verify and approve soon.
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
                {requiredCertificates.map(item => {
                  const cardId = getCardId(item);
                  const selectedType = selectedTypeByCard[cardId] ?? '';
                  const isViewOnly = isLockedCertificate(item);
                  const isSubmitting = submittingCardId === '__bulk__' || skipLoading;
                  const isPicking = pickingCardId === cardId;
                  const selectedFile = selectedFileByCard[cardId];
                  const isPdfFile = Boolean(
                    selectedFile?.type?.toLowerCase().includes('pdf')
                    || selectedFile?.name?.toLowerCase().endsWith('.pdf'),
                  );

                  return (
                  <View key={cardId} className="overflow-hidden rounded-2xl border border-accent/40 bg-white dark:border-white/10" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
                    <LinearGradient
                      colors={theme.gradients.cta}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: 7 }}
                    />
                    <View className="p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 flex-row">
                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
                          <Ionicons name="ribbon-outline" size={18} color={theme.colors.primary} />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text className="text-base font-bold text-baseDark dark:text-white">{item.title ?? 'Certificate'}</Text>
                          {!!item.description && (
                            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>{item.description}</Text>
                          )}
                        </View>
                      </View>
                      <Ionicons name="cloud-upload-outline" size={16} color={theme.colors.primary} />
                    </View>

                    <Text className="mt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                      Formats
                    </Text>
                    <View className="mt-2 flex-row items-center gap-2">
                      {['PDF', 'JPG', 'PNG'].map(format => (
                        <View key={`${cardId}-format-${format}`} className="rounded-md border px-2 py-1" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight }}>
                          <Text className="text-[10px] font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                            .{format}
                          </Text>
                        </View>
                      ))}
                      <Text className="text-[10px] font-medium" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>Max 5MB</Text>
                    </View>

                    <Text className="mt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                      Unlocks Services
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
                        <Text className="mt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                          Certificate Type *
                        </Text>
                        <View className="mt-2 flex-row flex-wrap gap-2">
                          {(item.allowedCertificateTypes ?? []).map((type, typeIndex) => {
                            const isSelected = selectedType === type;
                            return (
                              <Pressable
                                key={`${cardId}-type-${typeIndex}`}
                                onPress={() => {
                                  if (isSubmitting || isPicking) return;
                                  setSelectedTypeByCard(prev => ({ ...prev, [cardId]: type }));
                                }}
                                disabled={isSubmitting || isPicking}
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

                      <Pressable
                        onPress={() => {
                          void onPickFile(item);
                        }}
                        disabled={isPicking || isSubmitting}
                        className="mt-3 items-center rounded-2xl border border-dashed px-4 py-6"
                        style={{
                          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                          backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.trackLight,
                        }}
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
                          <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.primary} />
                        </View>
                        <Text className="mt-2 text-base font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                          {isPicking ? 'Adding file...' : 'Tap to upload'}
                        </Text>
                        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                          or drag and drop your file here
                        </Text>
                        <Text className="mt-2 text-[11px]" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                          PDF, JPG, PNG up to 5MB
                        </Text>
                        {selectedFile ? (
                          <View className="mt-3 w-full flex-row items-start rounded-xl border px-3 py-2" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85 }}>
                            <View className="mr-2 mt-0.5 h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
                              <Ionicons
                                name={isPdfFile ? 'document-text-outline' : 'image-outline'}
                                size={15}
                                color={theme.colors.primary}
                              />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                                {selectedFile.name}
                              </Text>
                              <Text className="mt-0.5 text-[11px]" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                                {isPdfFile ? 'PDF file selected' : 'Image file selected'}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View className="mt-3 w-full rounded-xl border px-3 py-2" style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight, backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85 }}>
                            <Text className="text-xs font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                              No file selected yet
                            </Text>
                          </View>
                        )}
                      </Pressable>
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
                  </View>
                )})}
              </View>
            )}
          </View>
        )}
      </View>

      {!showWaitingState ? (
        <View className="mt-4">
          <Button
            label="Upload and Continue"
            onPress={onUploadAndContinue}
            loading={submittingCardId === '__bulk__'}
            disabled={!canUploadAll || skipLoading}
          />
        </View>
      ) : null}
    </GradientScreen>
  );
}

