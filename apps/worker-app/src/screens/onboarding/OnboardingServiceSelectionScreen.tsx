import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { createWorkerServices, getCategories, updateWorkerProfile } from '@/actions';
import { WorkerSkillCategoryGrid } from '@/components/worker-skills/WorkerSkillCategoryGrid';
import { WorkerSkillReviewList } from '@/components/worker-skills/WorkerSkillReviewList';
import { WorkerSkillServicesList } from '@/components/worker-skills/WorkerSkillServicesList';
import { WorkerSkillSubcategoryTabs } from '@/components/worker-skills/WorkerSkillSubcategoryTabs';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { AppIcon } from '@/icons';
import { AppSpinner } from '@/components/common/AppSpinner';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import {
  CategoryService,
  ServiceCategory,
  ServiceSubcategory,
} from '@/types/auth';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { normalizeServices, titleCase } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingServiceSelection'>;
type SkillStep = 'select' | 'preview';

const ONBOARDING_CITY = 'PRAYAGRAJ';
const SKILL_LOG_PREFIX = '[OnboardingServiceSelection]';

export function OnboardingServiceSelectionScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const {
    getOnboardingRedirect,
    refreshOnboardingRoute,
    markOnboardingStepSeen,
  } = useOnboardingContext();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [step, setStep] = useState<SkillStep>('select');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ServiceSubcategory | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Record<string, CategoryService>>({});
  const formLocked = serviceSaving || skipLoading;
  const lastToggleRef = useRef<{ serviceId: string; timestamp: number } | null>(null);
  const logSelectionDebug = useCallback((event: string, payload?: Record<string, unknown>) => {
    if (!__DEV__) return;
    console.log(`${SKILL_LOG_PREFIX} ${event}`, payload ?? {});
  }, []);

  useEffect(() => {
    const redirect = getOnboardingRedirect(ONBOARDING_SCREENS.serviceSelection);
    if (redirect) {
      navigation.replace(redirect);
    }
  }, [getOnboardingRedirect, navigation]);

  const fetchCategories = useCallback(async (showLoader = false) => {
    try {
      logSelectionDebug('fetch_categories_start', { showLoader });
      if (showLoader) {
        setCategoriesLoading(true);
      } else {
        setRefreshing(true);
      }

      const categoriesResponse = await getCategories({
        city: ONBOARDING_CITY,
        includeSubcategory: true,
        includeServices: true,
        includePriceOptions: true,
      });
      const nextCategories = Array.isArray(categoriesResponse) ? categoriesResponse : [];
      setCategories(nextCategories);
      logSelectionDebug('fetch_categories_success', { totalCategories: nextCategories.length });

      setSelectedCategory(prevSelectedCategory => {
        if (!prevSelectedCategory) return null;
        const nextSelectedCategory = nextCategories.find(category => category.id === prevSelectedCategory.id) ?? null;
        logSelectionDebug('sync_selected_category_after_fetch', {
          previousCategoryId: prevSelectedCategory.id,
          nextCategoryId: nextSelectedCategory?.id ?? null,
        });

        setSelectedSubcategory(prevSelectedSubcategory => {
          if (!nextSelectedCategory) return null;
          const nextSubcategories = Array.isArray(nextSelectedCategory.subcategories)
            ? nextSelectedCategory.subcategories
            : [];
          if (!prevSelectedSubcategory) {
            const firstSubcategory = nextSubcategories[0] ?? null;
            logSelectionDebug('sync_selected_subcategory_after_fetch', {
              previousSubcategoryId: null,
              nextSubcategoryId: firstSubcategory?.id ?? null,
            });
            return firstSubcategory;
          }
          const nextSubcategory =
            nextSubcategories.find(subcategory => subcategory.id === prevSelectedSubcategory.id) ??
            nextSubcategories[0] ??
            null;
          logSelectionDebug('sync_selected_subcategory_after_fetch', {
            previousSubcategoryId: prevSelectedSubcategory.id,
            nextSubcategoryId: nextSubcategory?.id ?? null,
          });
          return nextSubcategory;
        });

        return nextSelectedCategory;
      });
    } finally {
      logSelectionDebug('fetch_categories_end', { showLoader });
      setCategoriesLoading(false);
      setRefreshing(false);
    }
  }, [logSelectionDebug]);

  useEffect(() => {
    void fetchCategories(true);
  }, [fetchCategories]);

  const onRefresh = useCallback(() => {
    if (categoriesLoading || formLocked) return;
    void fetchCategories(false);
  }, [categoriesLoading, fetchCategories, formLocked]);

  const currentServices = useMemo(
    () => normalizeServices(selectedSubcategory ?? undefined),
    [selectedSubcategory],
  );
  const categoryList = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories],
  );
  const subcategoryList = useMemo(
    () => (Array.isArray(selectedCategory?.subcategories) ? selectedCategory.subcategories : []),
    [selectedCategory],
  );

  const selectedServices = useMemo(
    () => Object.values(selectedServiceIds),
    [selectedServiceIds],
  );

  const selectedServiceNames = useMemo(
    () => selectedServices.map(service => service.name),
    [selectedServices],
  );

  const toggleService = (service: CategoryService) => {
    const normalizedServiceId = String(service.id ?? '').trim();
    if (!normalizedServiceId) {
      logSelectionDebug('toggle_service_blocked_missing_id', {
        serviceName: service.name,
        rawServiceId: service.id,
      });
      return;
    }
    const now = Date.now();
    const lastToggle = lastToggleRef.current;
    if (lastToggle?.serviceId === normalizedServiceId && now - lastToggle.timestamp < 300) {
      logSelectionDebug('toggle_service_ignored_rapid_repeat', {
        serviceId: normalizedServiceId,
        serviceName: service.name,
        deltaMs: now - lastToggle.timestamp,
      });
      return;
    }
    lastToggleRef.current = { serviceId: normalizedServiceId, timestamp: now };

    setSelectedServiceIds(prev => {
      const next = { ...prev };
      const wasSelected = Boolean(next[normalizedServiceId]);
      if (next[normalizedServiceId]) {
        delete next[normalizedServiceId];
      } else {
        next[normalizedServiceId] = { ...service, id: normalizedServiceId };
      }
      logSelectionDebug('toggle_service', {
        serviceId: normalizedServiceId,
        serviceName: service.name,
        subcategoryId: selectedSubcategory?.id ?? null,
        categoryId: selectedCategory?.id ?? null,
        wasSelected,
        isSelectedAfterToggle: !wasSelected,
        selectedCountAfterToggle: Object.keys(next).length,
      });
      return next;
    });
  };

  useEffect(() => {
    logSelectionDebug('selected_category_changed', {
      selectedCategoryId: selectedCategory?.id ?? null,
      selectedCategoryName: selectedCategory?.name ?? null,
    });
  }, [logSelectionDebug, selectedCategory]);

  useEffect(() => {
    logSelectionDebug('selected_subcategory_changed', {
      selectedSubcategoryId: selectedSubcategory?.id ?? null,
      selectedSubcategoryName: selectedSubcategory?.name ?? null,
    });
  }, [logSelectionDebug, selectedSubcategory]);

  useEffect(() => {
    logSelectionDebug('selected_services_changed', {
      selectedServiceIds: Object.keys(selectedServiceIds),
      selectedServiceNames: Object.values(selectedServiceIds).map(service => service.name),
    });
  }, [logSelectionDebug, selectedServiceIds]);

  const onSaveServices = async () => {
    if (selectedServiceNames.length === 0 || formLocked) return;
    try {
      setServiceSaving(true);
      await createWorkerServices(
        { city: ONBOARDING_CITY, skills: selectedServiceNames },
        { showSuccessToast: false },
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

  const onResetServices = () => {
    if (formLocked) return;
    setSelectedServiceIds({});
    setSelectedSubcategory(null);
    setSelectedCategory(null);
    setStep('select');
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

  const onBackStep = () => {
    if (formLocked) return;

    if (step === 'preview') {
      setStep('select');
      return;
    }

    if (selectedCategory) {
      setSelectedSubcategory(null);
      setSelectedCategory(null);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const showBackButton = Boolean(step === 'preview' || selectedCategory || selectedSubcategory || navigation.canGoBack());
  const isPreviewStep = step === 'preview';
  const canOpenPreview = selectedServices.length > 0;
  const currentSkillStep = isPreviewStep ? 3 : (selectedCategory ? 2 : 1);

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
          {!isPreviewStep ? (
            <View className="flex-row items-center gap-2">
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
          ) : null}
        </View>

        <View className="mt-3">
          <SplitGradientTitle
            eyebrow={APP_TEXT.onboarding.vehicle.step}
            prefix={isPreviewStep ? APP_TEXT.onboarding.vehicle.previewTitlePrefix : APP_TEXT.onboarding.vehicle.selectTitlePrefix}
            highlight={isPreviewStep ? APP_TEXT.onboarding.vehicle.previewTitleHighlight : APP_TEXT.onboarding.vehicle.selectTitleHighlight}
            subtitle={isPreviewStep ? APP_TEXT.onboarding.vehicle.previewSubtitle : APP_TEXT.onboarding.vehicle.subtitle}
            prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
            highlightClassName="text-4xl font-extrabold leading-[40px]"
            subtitleClassName="mt-2 text-sm"
            showSparkle={false}
          />
        </View>

        <View className="mt-4 flex-row gap-2">
          {[1, 2, 3].map(stepIndex => (
            <View
              key={`skill-step-${stepIndex}`}
              className={`h-1.5 flex-1 rounded-full ${stepIndex <= currentSkillStep ? 'bg-primary' : 'bg-accent/30 dark:bg-white/10'}`}
            />
          ))}
        </View>

        {categoriesLoading ? (
          <View className="mt-8 items-center justify-center">
            <AppSpinner size="large" color={uiColors.onboarding.loader} />
          </View>
        ) : (
          <View className="mt-4">
            {!isPreviewStep ? (
              <>
                {!selectedCategory ? (
                  <WorkerSkillCategoryGrid
                    categories={categoryList}
                    selectedCategoryId={null}
                    disabled={formLocked}
                    isDark={isDark}
                    onSelectCategory={category => {
                      const firstSubcategory = Array.isArray(category.subcategories)
                        ? category.subcategories[0] ?? null
                        : null;
                      logSelectionDebug('select_category', {
                        categoryId: category.id,
                        categoryName: category.name,
                        firstSubcategoryId: firstSubcategory?.id ?? null,
                      });
                      setSelectedCategory(category);
                      setSelectedSubcategory(firstSubcategory);
                    }}
                  />
                ) : null}

                {selectedCategory && selectedSubcategory ? (
                  <View>
                    <Text className="mb-2 text-lg font-bold text-baseDark dark:text-white">{titleCase(selectedCategory.name)}</Text>
                    <WorkerSkillSubcategoryTabs
                      subcategories={subcategoryList}
                      selectedSubcategoryId={selectedSubcategory.id}
                      disabled={formLocked}
                      isDark={isDark}
                      onSelectSubcategory={subcategory => {
                        logSelectionDebug('select_subcategory', {
                          subcategoryId: subcategory.id,
                          subcategoryName: subcategory.name,
                          previousSubcategoryId: selectedSubcategory?.id ?? null,
                          categoryId: selectedCategory.id,
                        });
                        setSelectedSubcategory(subcategory);
                      }}
                    />
                    <Text className="mb-2 text-lg font-bold text-baseDark dark:text-white">{titleCase(selectedSubcategory.name)}</Text>
                    <WorkerSkillServicesList
                      services={currentServices}
                      selectedServiceIds={selectedServiceIds}
                      disabled={formLocked}
                      isDark={isDark}
                      onToggleService={toggleService}
                    />
                  </View>
                ) : null}
              </>
            ) : (
              <WorkerSkillReviewList
                selectedServices={selectedServices}
                disabled={formLocked}
                isDark={isDark}
                onRemoveService={serviceId => {
                  if (formLocked) return;
                  setSelectedServiceIds(prev => {
                    const next = { ...prev };
                    delete next[serviceId];
                    return next;
                  });
                }}
              />
            )}
          </View>
        )}

      {isPreviewStep ? (
        <View className="mt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-primary">
              {selectedServices.length} {APP_TEXT.onboarding.vehicle.selectedSkillCountLabel}
            </Text>
            <Pressable
              onPress={onResetServices}
              disabled={formLocked || selectedServices.length === 0}
              className={`flex-row items-center rounded-full px-3 py-1.5 ${
                formLocked || selectedServices.length === 0
                  ? 'bg-accent/20 opacity-60'
                  : 'bg-primary/10'
              }`}
              style={formLocked || selectedServices.length === 0 ? { backgroundColor: isDark ? uiColors.surface.chipDark : uiColors.surface.accentSoft20 } : undefined}
            >
              <AppIcon name="refresh" size={12} color={theme.colors.primary} />
              <Text className="text-xs font-semibold text-primary">
                {' '}{APP_TEXT.onboarding.vehicle.resetSkillsButton}
              </Text>
            </Pressable>
          </View>
          <Button
            label={APP_TEXT.onboarding.vehicle.saveServicesButton}
            onPress={onSaveServices}
            loading={serviceSaving}
            disabled={formLocked || selectedServices.length === 0}
          />
        </View>
      ) : (
        <View className="mt-4">
          <Button
            label={APP_TEXT.onboarding.vehicle.previewSkillsButton}
            onPress={() => {
              if (formLocked || !canOpenPreview) return;
              setStep('preview');
            }}
            disabled={formLocked || !canOpenPreview}
          />
        </View>
      )}
    </GradientScreen>
  );
}
