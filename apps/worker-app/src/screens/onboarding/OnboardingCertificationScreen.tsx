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
import { FileUploadCard } from '@/components/common/FileUploadCard';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { OnboardingStackParamList } from '@/types/navigation';
import { WorkerCertificateCard, WorkerCertificateWriteItem } from '@/types/auth';
import { SelectedCertificateFile } from '@/types/onboarding';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
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

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingCertification'>;

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

export function OnboardingCertificationScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const {
    getOnboardingRedirect,
    refreshOnboardingRoute,
    getRequiredCertificates,
    completeCertificateUpload,
    skipCertificateUpload,
  } = useOnboardingContext();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [screenLoading, setScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickingCardId, setPickingCardId] = useState<string | null>(null);
  const [certificatesLoadError, setCertificatesLoadError] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [requiredCertificates, setRequiredCertificates] = useState<WorkerCertificateCard[]>([]);
  const [selectedTypeByCard, setSelectedTypeByCard] = useState<Record<string, string>>({});
  const [selectedFileByCard, setSelectedFileByCard] = useState<Record<string, SelectedCertificateFile>>({});
  const [hasSubmittedThisSession, setHasSubmittedThisSession] = useState(false);
  const formLocked = isSubmitting || skipLoading;

  const loadCertificates = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setScreenLoading(true);
      } else {
        setRefreshing(true);
      }
      const certificates = await getRequiredCertificates();
      setRequiredCertificates(certificates);
      setCertificatesLoadError(false);
      setSelectedTypeByCard(prev => {
        const next: Record<string, string> = {};
        certificates.forEach((card: WorkerCertificateCard) => {
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
  }, [getRequiredCertificates]);

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
    setSelectedFileByCard({});
    setSelectedTypeByCard({});
    setHasSubmittedThisSession(false);
    void Promise.all([
      refreshOnboardingRoute(true).catch(() => {
        showError('Could not refresh onboarding flags.');
      }),
      loadCertificates(false),
    ]);
  }, [formLocked, loadCertificates, refreshOnboardingRoute, screenLoading]);

  useEffect(() => {
    const redirect = getOnboardingRedirect(ONBOARDING_SCREENS.certification);
    if (redirect) {
      navigation.replace(redirect);
    }
  }, [getOnboardingRedirect, navigation]);

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

  const cardsNeedingUpload = requiredCertificates.filter(card => !isLockedCertificate(card));
  const cardsToSubmit = cardsNeedingUpload;
  const allCardsLocked = requiredCertificates.length > 0 && cardsNeedingUpload.length === 0;
  const showWaitingState = allCardsLocked || hasSubmittedThisSession;

  const readyCertificates = cardsToSubmit
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

  const canUploadAny = showWaitingState || readyCertificates.length > 0;

  const onUploadAndContinue = async () => {
    if (formLocked) return;

    if (showWaitingState || cardsToSubmit.length === 0) {
      try {
        const nextRoute = await refreshOnboardingRoute(true);
        navigation.replace(nextRoute);
      } catch {
        showError('Could not refresh onboarding flags.');
      }
      return;
    }
    if (readyCertificates.length === 0) return;

    setIsSubmitting(true);
    try {
      await completeCertificateUpload({ certificates: readyCertificates });
      setHasSubmittedThisSession(true);
      setSelectedFileByCard({});
      setSelectedTypeByCard({});
      navigation.replace(ONBOARDING_SCREENS.welcomeWorker);
      void refreshOnboardingRoute(true).then(nextRoute => {
        if (nextRoute !== ONBOARDING_SCREENS.welcomeWorker) {
          navigation.replace(nextRoute);
        }
      });
    } catch {
      // API layer already shows backend message via toast.
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSkipCertificates = async () => {
    if (formLocked) return;
    setSkipLoading(true);
    try {
      try {
        await skipCertificateUpload();
        navigation.replace(ONBOARDING_SCREENS.welcomeWorker);
        void refreshOnboardingRoute(true).then(nextRoute => {
          if (nextRoute !== ONBOARDING_SCREENS.welcomeWorker) {
            navigation.replace(nextRoute);
          }
        });
      } catch {
        navigation.replace(ONBOARDING_SCREENS.welcomeWorker);
      }
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
        <View className="mt-3">
          <SplitGradientTitle
            eyebrow={APP_TEXT.onboarding.certification.step}
            prefix={APP_TEXT.onboarding.certification.titlePrefix}
            highlight={APP_TEXT.onboarding.certification.titleHighlight}
            subtitle={APP_TEXT.onboarding.certification.subtitle}
            prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
            highlightClassName="text-4xl font-extrabold leading-[40px]"
            subtitleClassName="mt-2 text-sm"
            showSparkle={false}
          />
        </View>
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
        ) : (
          <View className="mt-4">
            {requiredCertificates.length === 0 ? (
              <ListEmptyState
                icon="ribbon-outline"
                title={APP_TEXT.onboarding.certification.noCertificateText}
                description="You can continue and add certificates later."
              />
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
                  const cardId = getCertificateCardId(item);
                  const selectedType = selectedTypeByCard[cardId] ?? '';
                  const isViewOnly = isLockedCertificate(item);
                  const cardSubmitting = isSubmitting || skipLoading;
                  const isPicking = pickingCardId === cardId;
                  const selectedFile = selectedFileByCard[cardId];

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
                                  if (cardSubmitting || isPicking) return;
                                  setSelectedTypeByCard(prev => ({ ...prev, [cardId]: type }));
                                }}
                                disabled={cardSubmitting || isPicking}
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
                        disabled={isPicking || cardSubmitting}
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
                  </View>
                )})}
              </View>
            )}
          </View>
        )}

      {!showWaitingState ? (
        <View className="mt-4">
          <Button
            label="Upload and Continue"
            onPress={onUploadAndContinue}
            loading={isSubmitting}
            disabled={!canUploadAny || skipLoading}
          />
        </View>
      ) : null}
    </GradientScreen>
  );
}

