import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createWorkerCertificates, getWorkerStatus, updateWorkerCertificates } from '@/actions';
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
import type { ProfileCertificateManagerScreenProps } from '@/types/screen-props';
import { WorkerCertificateCard, WorkerCertificateWriteItem } from '@/types/auth';
import { SelectedCertificateFile } from '@/types/onboarding';
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

export function ProfileCertificateAddAndEditScreen({ navigation }: ProfileCertificateManagerScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [screenLoading, setScreenLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickingCardId, setPickingCardId] = useState<string | null>(null);
  const [certificatesLoadError, setCertificatesLoadError] = useState(false);
  const [requiredCertificates, setRequiredCertificates] = useState<WorkerCertificateCard[]>([]);
  const [selectedTypeByCard, setSelectedTypeByCard] = useState<Record<string, string>>({});
  const [selectedFileByCard, setSelectedFileByCard] = useState<Record<string, SelectedCertificateFile>>({});
  const [showTypeErrors, setShowTypeErrors] = useState(false);

  const loadCertificates = useCallback(async (options?: { showFullScreenLoader?: boolean }) => {
    const showFullScreenLoader = options?.showFullScreenLoader ?? true;
    try {
      if (showFullScreenLoader) {
        setScreenLoading(true);
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
  }, []);

  useEffect(() => {
    void loadCertificates({ showFullScreenLoader: true });
  }, [loadCertificates]);

  const refreshCertificates = useCallback(async () => {
    if (screenLoading || isSubmitting) return;
    setShowTypeErrors(false);
    await loadCertificates({ showFullScreenLoader: false });
  }, [isSubmitting, loadCertificates, screenLoading]);
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
  const hasCertificatesUnderReview = requiredCertificates.some(isPendingCertificate);
  const canSaveCertificates = readyCertificates.length > 0;

  const onSaveCertificates = async () => {
    if (isSubmitting) return;

    const missingType = cardsNeedingUpload.some(card => {
      const cardId = getCertificateCardId(card);
      return !selectedTypeByCard[cardId] && Boolean(selectedFileByCard[cardId]);
    });
    if (missingType) {
      setShowTypeErrors(true);
      showError(APP_TEXT.profile.certificates.card.typeRequiredHint);
      return;
    }
    if (!canSaveCertificates) {
      setShowTypeErrors(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const updateItems = readyCertificates.filter(item => typeof item.certificateId === 'string' && item.certificateId.trim().length > 0);
      const createItems = readyCertificates.filter(item => !(typeof item.certificateId === 'string' && item.certificateId.trim().length > 0));

      if (createItems.length > 0) {
        await createWorkerCertificates({ certificates: createItems });
      }
      if (updateItems.length > 0) {
        await updateWorkerCertificates({ certificates: updateItems });
      }
      setSelectedFileByCard({});
      setSelectedTypeByCard({});
      setShowTypeErrors(false);
      await loadCertificates({ showFullScreenLoader: false });
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
      {navigation.canGoBack() ? <DetailsTopBar onBack={() => navigation.goBack()} /> : null}

      <View className="mt-3">
        <SplitGradientTitle
          prefix={APP_TEXT.profile.certificates.titlePrefix}
          highlight={APP_TEXT.profile.certificates.titleHighlight}
          subtitle={APP_TEXT.profile.certificates.subtitle}
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
      ) : requiredCertificates.length === 0 ? (
        <ListEmptyState
          containerClassName="mt-4"
          icon="ribbon-outline"
          title={APP_TEXT.profile.certificates.emptyState}
          description={APP_TEXT.profile.certificates.emptyDescription}
        />
      ) : (
        <View className="mt-4 gap-3">
          {hasCertificatesUnderReview ? (
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
            return (
              <CertificateUploadCard
                key={cardId}
                card={item}
                selectedType={selectedTypeByCard[cardId] ?? ''}
                selectedFile={selectedFileByCard[cardId]}
                isViewOnly={isLockedCertificate(item)}
                isPicking={pickingCardId === cardId}
                disabled={isSubmitting}
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

      {!allCardsLocked && requiredCertificates.length > 0 ? (
        <View className="mt-4">
          <Button
            label={APP_TEXT.profile.certificates.saveButton}
            onPress={onSaveCertificates}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      ) : null}
    </GradientScreen>
  );
}
