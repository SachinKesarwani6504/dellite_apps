import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { createWorkerServices, getCategories, updateWorkerProfile } from '@/actions';
import { WorkerSelectedSkillStrip } from '@/components/worker-skills/WorkerSelectedSkillStrip';
import { WorkerSkillTreeSelector } from '@/components/worker-skills/WorkerSkillTreeSelector';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { AppIcon } from '@/icons';
import { AppSpinner } from '@/components/common/AppSpinner';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { CategoryService, ServiceCategory } from '@/types/auth';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingServiceSelection'>;

const ONBOARDING_CITY = 'PRAYAGRAJ';

export function OnboardingServiceSelectionScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const {
    refreshOnboardingRoute,
    markOnboardingStepSeen,
  } = useOnboardingContext();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Record<string, CategoryService>>({});
  const formLocked = serviceSaving || skipLoading;

  const fetchCategories = useCallback(async (options?: { showFullScreenLoader?: boolean }) => {
    const showFullScreenLoader = options?.showFullScreenLoader ?? false;
    try {
      if (showFullScreenLoader) {
        setLoading(true);
      }

      const categoriesResponse = await getCategories({
        city: ONBOARDING_CITY,
        includeSubcategory: true,
        includeServices: true,
        includePriceOptions: true,
      });
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      setLoadError(false);
    } catch {
      setCategories([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories({ showFullScreenLoader: true });
  }, [fetchCategories]);

  const refreshCategories = useCallback(async () => {
    if (loading || formLocked) return;
    await fetchCategories({ showFullScreenLoader: false });
  }, [fetchCategories, formLocked, loading]);
  const { refreshing, onRefresh } = usePullToRefresh(refreshCategories);

  const selectedServices = useMemo(
    () => Object.values(selectedServiceIds),
    [selectedServiceIds],
  );

  const selectedServiceNames = useMemo(
    () => selectedServices.map(service => service.name),
    [selectedServices],
  );

  const onToggleService = useCallback((service: CategoryService) => {
    if (formLocked) return;
    const normalizedServiceId = String(service.id ?? '').trim();
    if (!normalizedServiceId) return;

    setSelectedServiceIds(prev => {
      const next = { ...prev };
      if (next[normalizedServiceId]) delete next[normalizedServiceId];
      else next[normalizedServiceId] = { ...service, id: normalizedServiceId };
      return next;
    });
  }, [formLocked]);

  const onSaveServices = async () => {
    if (selectedServiceNames.length === 0 || formLocked) return;
    try {
      setServiceSaving(true);
      await createWorkerServices(
        { city: ONBOARDING_CITY, skills: selectedServiceNames },
        { showSuccessToast: false },
      );
      await updateWorkerProfile(
        { hasSeenSkillSetup: true },
        { showSuccessToast: false, showErrorToast: false },
      );
      markOnboardingStepSeen('SERVICE_SELECTION');
      navigation.replace(ONBOARDING_SCREENS.certification);
      const nextRoute = await refreshOnboardingRoute(true);
      if (nextRoute !== ONBOARDING_SCREENS.certification) {
        navigation.replace(nextRoute);
      }
    } finally {
      setServiceSaving(false);
    }
  };

  const onSkipServices = async () => {
    if (formLocked) return;
    setSkipLoading(true);
    try {
      try {
        await updateWorkerProfile(
          { hasSeenSkillSetup: true, hasSeenCertificateSetup: true },
          { showSuccessToast: false, showErrorToast: false },
        );
        markOnboardingStepSeen('SERVICE_SELECTION');
        markOnboardingStepSeen('CERTIFICATE_UPLOAD');
        navigation.replace(ONBOARDING_SCREENS.welcomeWorker);
        void refreshOnboardingRoute(true);
      } catch {
        navigation.replace(ONBOARDING_SCREENS.welcomeWorker);
      }
    } finally {
      setSkipLoading(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}
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
          {navigation.canGoBack() ? <DetailsTopBar onBack={() => navigation.goBack()} /> : null}
        </View>
        <View className="flex-1" />
        <Pressable
          onPress={() => {
            void onSkipServices();
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
              <Text className="text-xs font-semibold text-primary">{APP_TEXT.onboarding.vehicle.skipButton}</Text>
              <AppIcon name="chevronRight" size={14} color={theme.colors.primary} />
            </>
          )}
        </Pressable>
      </View>

      <View className="mt-3">
        <SplitGradientTitle
          prefix={APP_TEXT.onboarding.vehicle.selectTitlePrefix}
          highlight={APP_TEXT.onboarding.vehicle.selectTitleHighlight}
          subtitle={APP_TEXT.onboarding.vehicle.subtitle}
          showSparkle={false}
        />
      </View>

      <View
        className="mt-4 rounded-2xl border px-3 py-3"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke,
          backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.noticeWarmLight,
        }}
      >
        <Text className="text-sm font-bold text-baseDark dark:text-white">
          {APP_TEXT.onboarding.vehicle.addMoreTitle}
        </Text>
        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.onboarding.vehicle.addMoreSubtitle}
        </Text>
      </View>

      {loading ? (
        <View className="mt-8 items-center">
          <AppSpinner size="large" color={uiColors.onboarding.loader} />
        </View>
      ) : loadError ? (
        <View className="mt-5">
          <ListErrorState
            title={APP_TEXT.onboarding.vehicle.loadErrorTitle}
            description={APP_TEXT.onboarding.vehicle.loadErrorDescription}
            onAction={() => {
              void fetchCategories({ showFullScreenLoader: true });
            }}
          />
        </View>
      ) : categories.length === 0 ? (
        <View className="mt-5">
          <ListEmptyState
            icon="list-outline"
            title={APP_TEXT.onboarding.vehicle.emptyServicesTitle}
            description={APP_TEXT.onboarding.vehicle.emptyServicesDescription}
          />
        </View>
      ) : (
        <View className="mt-4">
          <WorkerSkillTreeSelector
            categories={categories}
            selectedServiceIds={selectedServiceIds}
            existingSkillsByKey={{}}
            disabled={formLocked}
            isDark={isDark}
            onToggleService={onToggleService}
          />
          <View className="mt-5">
            <WorkerSelectedSkillStrip
              selectedServices={selectedServices}
              disabled={formLocked}
              isDark={isDark}
              onRemoveService={onToggleService}
            />
            <Button
              label={APP_TEXT.onboarding.vehicle.saveServicesButton}
              onPress={onSaveServices}
              loading={serviceSaving}
              disabled={formLocked || selectedServices.length === 0}
            />
          </View>
        </View>
      )}
    </GradientScreen>
  );
}
