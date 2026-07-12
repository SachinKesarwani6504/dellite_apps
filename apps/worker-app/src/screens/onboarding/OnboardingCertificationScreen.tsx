import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AppSpinner } from '@/components/common/AppSpinner';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { CertificateUploadCard } from '@/components/common/CertificateUploadCard';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import type { OnboardingCertificationScreenProps } from '@/types/screen-props';
import { WorkerCertificateCard, WorkerCertificateWriteItem } from '@/types/auth';
import { SelectedCertificateFile } from '@/types/onboarding';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import {
  getCertificateCardId,
  isSupportedCertificateFile,
  isLockedCertificate,
  isPendingCertificate,
  pickCertificateType,
  resolveCertificateWorkerSkillIds,
  toWorkerCertificateWriteItem,
} from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { theme, uiColors } from '@/utils/theme';
import { showError } from '@/utils/toast';

export function OnboardingCertificationScreen({ navigation }: OnboardingCertificationScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const {
    refreshOnboardingRoute,
    getRequiredCertificates,
    completeCertificateUpload,
    skipCertificateUpload,
  } = useOnboardingContext();
  const [screenLoading, setScreenLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickingCardId, setPickingCardId] = useState<string | null>(null);
  const [certificatesLoadError, setCertificatesLoadError] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [requiredCertificates, setRequiredCertificates] = useState<WorkerCertificateCard[]>([]);
  const [selectedTypeByCard, setSelectedTypeByCard] = useState<Record<string, string>>({});
  const [selectedFileByCard, setSelectedFileByCard] = useState<Record<string, SelectedCertificateFile>>({});
  const [hasSubmittedThisSession, setHasSubmittedThisSession] = useState(false);
  const [showTypeErrors, setShowTypeErrors] = useState(false);
  const formLocked = isSubmitting || skipLoading;

  const loadCertificates = useCallback(async (options?: { showFullScreenLoader?: boolean }) => {
    const showFullScreenLoader = options?.showFullScreenLoader ?? true;
    try {
      if (showFullScreenLoader) {
        setScreenLoading(true);
      }
      const certificates = await getRequiredCertificates();
      setRequiredCertificates(certificates);
      setCertificatesLoadError(false);
      setSelectedTypeByCard(prev => {
        const next: Record<string, string> = {};
        certificates.forEach((card: WorkerCertificateCard) => {
          const cardId = getCertificateCardId(card);
          const allowedTypes = card.allowedCertificateTypes ?? [];
          const existing = prev[cardId];
          if (existing && allowedTypes.includes(existing)) {
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
    }
  }, [getRequiredCertificates]);

  useEffect(() => {
    void loadCertificates({ showFullScreenLoader: true });
  }, [loadCertificates]);

  const onBackStep = () => {
    if (formLocked) return;
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const refreshCertificates = useCallback(async () => {
    if (screenLoading || formLocked) return;
    setSelectedFileByCard({});
    setSelectedTypeByCard({});
    setHasSubmittedThisSession(false);
    setShowTypeErrors(false);
    await Promise.all([
      refreshOnboardingRoute(true).catch(() => {
        showError('Could not refresh onboarding flags.');
      }),
      loadCertificates({ showFullScreenLoader: false }),
    ]);
  }, [formLocked, loadCertificates, refreshOnboardingRoute, screenLoading]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshCertificates);

  const onPickFile = async (card: WorkerCertificateCard) => {
    const cardId = getCertificateCardId(card);
    setPickingCardId(cardId);
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
  const hasCertificatesUnderReview = requiredCertificates.some(isPendingCertificate);
  const allCertificatesApproved = requiredCertificates.length > 0
    && requiredCertificates.every(card => card.certificateStatus === 'APPROVED');
  const showWaitingState = !allCertificatesApproved
    && (hasCertificatesUnderReview || hasSubmittedThisSession);

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

    const missingType = cardsToSubmit.some(card => {
      const cardId = getCertificateCardId(card);
      return !selectedTypeByCard[cardId] && Boolean(selectedFileByCard[cardId]);
    });
    if (missingType) {
      setShowTypeErrors(true);
      showError(APP_TEXT.profile.certificates.card.typeRequiredHint);
      return;
    }
    if (readyCertificates.length === 0) {
      setShowTypeErrors(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await completeCertificateUpload({ certificates: readyCertificates });
      setHasSubmittedThisSession(true);
      setSelectedFileByCard({});
      setSelectedTypeByCard({});
      setShowTypeErrors(false);
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
        <View className="w-10">{showBackButton ? <DetailsTopBar onBack={onBackStep} /> : null}</View>
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
          prefix={APP_TEXT.onboarding.certification.titlePrefix}
          highlight={APP_TEXT.onboarding.certification.titleHighlight}
          subtitle={APP_TEXT.onboarding.certification.subtitle}
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
          title={APP_TEXT.profile.certificates.loadErrorTitle}
          description={APP_TEXT.profile.certificates.loadErrorDescription}
          onAction={() => {
            void loadCertificates({ showFullScreenLoader: false });
          }}
        />
      ) : (
        <View className="mt-4">
          {requiredCertificates.length === 0 ? (
            <ListEmptyState
              icon="ribbon-outline"
              title={APP_TEXT.onboarding.certification.noCertificateText}
              description={APP_TEXT.onboarding.certification.emptyContinueHint}
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
                        {APP_TEXT.onboarding.certification.waitingTitle}
                      </Text>
                      <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                        {APP_TEXT.onboarding.certification.waitingSubtitle}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
              {requiredCertificates.map(item => {
                const cardId = getCertificateCardId(item);
                return (
                  <CertificateUploadCard
                    key={cardId}
                    card={item}
                    selectedType={selectedTypeByCard[cardId] ?? ''}
                    selectedFile={selectedFileByCard[cardId]}
                    isViewOnly={isLockedCertificate(item)}
                    isPicking={pickingCardId === cardId}
                    disabled={formLocked}
                    isDark={isDark}
                    showTypeError={showTypeErrors}
                    onSelectType={type => {
                      setShowTypeErrors(false);
                      setSelectedTypeByCard(prev => ({ ...prev, [cardId]: type }));
                    }}
                    onPickFile={() => {
                      void onPickFile(item);
                    }}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      {!showWaitingState ? (
        <View className="mt-4">
          <Button
            label={APP_TEXT.onboarding.certification.uploadAndContinueButton}
            onPress={onUploadAndContinue}
            loading={isSubmitting}
            disabled={!canUploadAny || skipLoading}
          />
        </View>
      ) : null}
    </GradientScreen>
  );
}
