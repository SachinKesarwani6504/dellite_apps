import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import { AppSpinner } from '@/components/common/AppSpinner';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { WorkerSkillCategoryGrid } from '@/components/worker-skills/WorkerSkillCategoryGrid';
import { WorkerSkillReviewList } from '@/components/worker-skills/WorkerSkillReviewList';
import { WorkerSkillServicesList } from '@/components/worker-skills/WorkerSkillServicesList';
import { WorkerSkillSubcategoryTabs } from '@/components/worker-skills/WorkerSkillSubcategoryTabs';
import { createWorkerServices, getCategories } from '@/actions';
import { CategoryService, ServiceCategory, ServiceSubcategory } from '@/types/auth';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { normalizeServices, titleCase } from '@/utils';
import { uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.skillManager>;
type SkillStep = 'select' | 'preview';

const DEFAULT_CITY = 'PRAYAGRAJ';

export function ProfileSkillAddAndEditScreen({ navigation, route }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  void route;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<SkillStep>('select');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ServiceSubcategory | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Record<string, CategoryService>>({});

  const loadCategories = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const response = await getCategories({
        city: DEFAULT_CITY,
        includeSubcategory: true,
        includeServices: true,
        includePriceOptions: true,
      });
      const nextCategories = Array.isArray(response) ? response : [];
      setCategories(nextCategories);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories(true);
  }, [loadCategories]);

  const onRefresh = useCallback(() => {
    if (loading || submitting) return;
    void loadCategories(false);
  }, [loadCategories, loading, submitting]);

  const categoryList = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories],
  );
  const subcategoryList = useMemo(
    () => (Array.isArray(selectedCategory?.subcategories) ? selectedCategory.subcategories : []),
    [selectedCategory],
  );
  const currentServices = useMemo(
    () => normalizeServices(selectedSubcategory ?? undefined),
    [selectedSubcategory],
  );
  const selectedServices = useMemo(() => Object.values(selectedServiceIds), [selectedServiceIds]);
  const selectedServiceNames = useMemo(() => selectedServices.map(item => item.name), [selectedServices]);
  const canOpenPreview = selectedServices.length > 0;

  const onToggleService = (service: CategoryService) => {
    setSelectedServiceIds(prev => {
      const next = { ...prev };
      if (next[service.id]) delete next[service.id];
      else next[service.id] = service;
      return next;
    });
  };

  const onSaveNewSkills = async () => {
    if (selectedServiceNames.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await createWorkerServices({ city: DEFAULT_CITY, skills: selectedServiceNames }, { showSuccessToast: true });
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshProps}
        />
      )}
    >
      <View className="mb-3">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>

      <SplitGradientTitle
        prefix={APP_TEXT.profile.skillManager.addTitlePrefix}
        highlight={APP_TEXT.profile.skillManager.titleHighlight}
        subtitle={APP_TEXT.profile.skillManager.addSubtitle}
        prefixClassName="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white"
        highlightClassName="text-4xl font-extrabold leading-[40px]"
        subtitleClassName="mt-2 text-sm"
        showSparkle={false}
      />

      {loading ? (
        <View className="mt-8 items-center">
          <AppSpinner size="large" color={uiColors.onboarding.loader} />
        </View>
      ) : (
        <View className="mt-4">
          {step === 'select' ? (
            <>
              {!selectedCategory ? (
                <WorkerSkillCategoryGrid
                  categories={categoryList}
                  selectedCategoryId={null}
                  disabled={submitting}
                  isDark={isDark}
                  onSelectCategory={category => {
                    const firstSubcategory = Array.isArray(category.subcategories)
                      ? category.subcategories[0] ?? null
                      : null;
                    setSelectedCategory(category);
                    setSelectedSubcategory(firstSubcategory);
                  }}
                />
              ) : null}

              {selectedCategory && selectedSubcategory ? (
                <View className="mt-2">
                  <Text className="mb-2 text-lg font-bold text-baseDark dark:text-white">{titleCase(selectedCategory.name)}</Text>
                  <WorkerSkillSubcategoryTabs
                    subcategories={subcategoryList}
                    selectedSubcategoryId={selectedSubcategory.id}
                    disabled={submitting}
                    isDark={isDark}
                    onSelectSubcategory={setSelectedSubcategory}
                  />
                  <Text className="mb-2 text-lg font-bold text-baseDark dark:text-white">{titleCase(selectedSubcategory.name)}</Text>
                  <WorkerSkillServicesList
                    services={currentServices}
                    selectedServiceIds={selectedServiceIds}
                    disabled={submitting}
                    isDark={isDark}
                    onToggleService={onToggleService}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <WorkerSkillReviewList
              selectedServices={selectedServices}
              disabled={submitting}
              isDark={isDark}
              onRemoveService={serviceId => {
                setSelectedServiceIds(prev => {
                  const next = { ...prev };
                  delete next[serviceId];
                  return next;
                });
              }}
            />
          )}

          <View className="mt-5">
            {step === 'select' ? (
              <Button
                label={APP_TEXT.onboarding.vehicle.previewSkillsButton}
                onPress={() => setStep('preview')}
                disabled={!canOpenPreview || submitting}
              />
            ) : (
              <View className="gap-3">
                <Button
                  label={APP_TEXT.onboarding.vehicle.saveServicesButton}
                  onPress={onSaveNewSkills}
                  loading={submitting}
                  disabled={selectedServices.length === 0 || submitting}
                />
                <Button
                  label={APP_TEXT.profile.skillManager.backToSelectionButton}
                  onPress={() => setStep('select')}
                  disabled={submitting}
                  variant="secondary"
                />
              </View>
            )}
          </View>
        </View>
      )} 
    </GradientScreen>
  );
}
