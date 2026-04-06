import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AppIcon } from '@/icons';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import {
  CategoryService,
  ServiceCategory,
  ServiceSubcategory,
} from '@/types/auth';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { titleCase } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingServiceSelection'>;

const ONBOARDING_CITY = 'PRAYAGRAJ';

function normalizeServices(subcategory?: ServiceSubcategory): CategoryService[] {
  return Array.isArray(subcategory?.services) ? subcategory.services : [];
}

function toIconBadgeText(name: string, iconText?: string): string {
  if (iconText?.trim()) return iconText.trim();
  const formatted = titleCase(name);
  return formatted.slice(0, 1).toUpperCase() || '?';
}

export function OnboardingServiceSelectionScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { fetchServiceCategories, saveWorkerServicesAndResolve, useScreenGuard } = useOnboarding();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ServiceSubcategory | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, CategoryService>>({});

  const fetchCategories = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const nextCategories = await fetchServiceCategories(ONBOARDING_CITY);
      setCategories(nextCategories);

      setSelectedCategory(prevSelectedCategory => {
        if (!prevSelectedCategory) return null;
        const nextSelectedCategory = nextCategories.find(category => category.id === prevSelectedCategory.id) ?? null;

        setSelectedSubcategory(prevSelectedSubcategory => {
          if (!nextSelectedCategory) return null;
          const nextSubcategories = Array.isArray(nextSelectedCategory.subcategories)
            ? nextSelectedCategory.subcategories
            : [];
          if (!prevSelectedSubcategory) {
            return nextSubcategories[0] ?? null;
          }
          return nextSubcategories.find(subcategory => subcategory.id === prevSelectedSubcategory.id) ?? nextSubcategories[0] ?? null;
        });

        return nextSelectedCategory;
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchServiceCategories]);

  useEffect(() => {
    void fetchCategories(true);
  }, [fetchCategories]);

  const onRefresh = useCallback(() => {
    if (loading || saving) return;
    void fetchCategories(false);
  }, [fetchCategories, loading, saving]);

  useScreenGuard({
    currentRoute: ONBOARDING_SCREENS.serviceSelection,
    onRedirect: route => navigation.replace(route),
  });

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

  const selectedServiceNames = useMemo(() => Object.keys(selectedServices), [selectedServices]);

  const toggleService = (service: CategoryService) => {
    setSelectedServices(prev => {
      const next = { ...prev };
      if (next[service.name]) {
        delete next[service.name];
      } else {
        next[service.name] = service;
      }
      return next;
    });
  };

  const onSaveServices = async () => {
    if (selectedServiceNames.length === 0 || saving) return;
    try {
      setSaving(true);
      const resolution = await saveWorkerServicesAndResolve(ONBOARDING_CITY, selectedServiceNames);
      if (resolution.shouldShowWelcome || resolution.nextRoute === ONBOARDING_SCREENS.welcome) {
        navigation.replace(ONBOARDING_SCREENS.welcome);
        return;
      }
      navigation.replace(resolution.nextRoute);
    } finally {
      setSaving(false);
    }
  };

  const onResetServices = () => {
    if (saving) return;
    setSelectedServices({});
    setSelectedSubcategory(null);
    setSelectedCategory(null);
  };

  const onBackStep = () => {
    if (selectedCategory) {
      setSelectedSubcategory(null);
      setSelectedCategory(null);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

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
        <BackButton
          onPress={onBackStep}
          visible={Boolean(selectedCategory || selectedSubcategory || navigation.canGoBack())}
        />
        <Text className="mt-3 text-xs font-bold tracking-widest text-primary">{APP_TEXT.onboarding.vehicle.step}</Text>
        <View className="mt-2">
          <Text className="text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white">Choose Your</Text>
          <GradientWord word="Services" className="text-4xl font-extrabold leading-[40px]" />
        </View>
        <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.onboarding.vehicle.subtitle}
        </Text>

        <View className="mt-4 flex-row gap-2">
          <View className="h-1.5 flex-1 rounded-full bg-primary" />
          <View className={`h-1.5 flex-1 rounded-full ${selectedCategory ? 'bg-primary' : 'bg-accent/30 dark:bg-white/10'}`} />
        </View>

        {loading ? (
          <View className="mt-8 items-center justify-center">
            <ActivityIndicator size="large" color={uiColors.onboarding.loader} />
          </View>
        ) : (
          <View className="mt-4">
            {!selectedCategory && (
              <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
                {categoryList.map(category => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      const firstSubcategory = Array.isArray(category.subcategories)
                        ? category.subcategories[0] ?? null
                        : null;
                      setSelectedCategory(category);
                      setSelectedSubcategory(firstSubcategory);
                    }}
                    className="w-[48%] rounded-2xl border border-accent/40 bg-white p-3 dark:border-white/10"
                    style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Text className="text-sm font-bold text-primary">
                        {toIconBadgeText(category.name, category.iconText)}
                      </Text>
                    </View>
                    <Text className="mt-2 text-sm font-bold text-baseDark dark:text-white">{titleCase(category.name)}</Text>
                    <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                      {(category.subcategories?.length ?? 0).toString()} subcategories
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {selectedCategory && selectedSubcategory && (
              <View>
                <Text className="mb-2 text-lg font-bold text-baseDark dark:text-white">{titleCase(selectedCategory.name)}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4, paddingRight: 8 }}
                  className="mb-3"
                >
                  <View className="flex-row gap-2">
                    {subcategoryList.map(subcategory => {
                      const isSelectedSubcategory = selectedSubcategory.id === subcategory.id;
                      return (
                        <Pressable
                          key={subcategory.id}
                          onPress={() => setSelectedSubcategory(subcategory)}
                          className="rounded-full border px-3 py-2"
                          style={{
                            borderColor: isSelectedSubcategory ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                            backgroundColor: isSelectedSubcategory ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
                          }}
                        >
                          <View className="flex-row items-center">
                            <View className="mr-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                              <Text className="text-[10px] font-bold text-primary">
                                {toIconBadgeText(subcategory.name, subcategory.iconText)}
                              </Text>
                            </View>
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: isSelectedSubcategory ? theme.colors.primary : (isDark ? palette.dark.text : palette.light.text) }}
                            >
                              {titleCase(subcategory.name)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                <Text className="mb-2 text-lg font-bold text-baseDark dark:text-white">{titleCase(selectedSubcategory.name)}</Text>
                <View className="gap-2">
                  {currentServices.map(service => {
                    const selected = Boolean(selectedServices[service.name]);
                    return (
                      <Pressable
                        key={service.id}
                        onPress={() => toggleService(service)}
                        className={`rounded-2xl border p-3 ${
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-accent/40 bg-white dark:border-white/10'
                        }`}
                        style={!selected ? { backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card } : undefined}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Text className="font-bold text-primary">
                              {toIconBadgeText(service.name, service.iconText)}
                            </Text>
                          </View>
                          <View className="flex-1 pr-2">
                            <Text className={`text-sm font-bold ${selected ? 'text-primary' : 'text-baseDark dark:text-white'}`}>
                              {titleCase(service.description || service.name)}
                            </Text>
                            {service.isCertificateRequired ? (
                              <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                                Certificate required
                              </Text>
                            ) : null}
                          </View>
                          <View
                            className={`h-6 w-6 items-center justify-center rounded-full border ${
                              selected ? 'border-primary bg-primary' : 'bg-white dark:bg-transparent'
                            }`}
                            style={!selected ? { borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight } : undefined}
                          >
                            {selected ? <Text className="text-[10px] font-bold text-white">OK</Text> : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      <View className="mt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-primary">
            {selectedServiceNames.length} Selected
          </Text>
          <Pressable
            onPress={onResetServices}
            disabled={saving || selectedServiceNames.length === 0}
            className={`flex-row items-center rounded-full px-3 py-1.5 ${
              saving || selectedServiceNames.length === 0
                ? 'bg-accent/20 opacity-60'
                : 'bg-primary/10'
            }`}
            style={saving || selectedServiceNames.length === 0 ? { backgroundColor: isDark ? uiColors.surface.chipDark : uiColors.surface.accentSoft20 } : undefined}
          >
            <AppIcon name="refresh" size={12} color={theme.colors.primary} />
            <Text className="text-xs font-semibold text-primary">
              {' '}Reset Selection
            </Text>
          </Pressable>
        </View>
        <Button
          label={APP_TEXT.onboarding.vehicle.saveServicesButton}
          onPress={onSaveServices}
          loading={saving}
          disabled={saving || selectedServiceNames.length === 0}
        />
      </View>
    </GradientScreen>
  );
}

