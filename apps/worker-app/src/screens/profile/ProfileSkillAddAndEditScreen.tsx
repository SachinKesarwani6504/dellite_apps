import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import { AppSpinner } from '@/components/common/AppSpinner';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { Button } from '@/components/common/Button';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { WorkerSelectedSkillStrip } from '@/components/worker-skills/WorkerSelectedSkillStrip';
import { WorkerSkillTreeSelector } from '@/components/worker-skills/WorkerSkillTreeSelector';
import { useSkillManagerController } from '@/hooks/useSkillManagerController';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';

export function ProfileSkillAddAndEditScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.skillManager>) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const {
    loading,
    loadError,
    submitting,
    refreshing,
    onRefresh,
    categories,
    selectedServiceIds,
    existingSkillsByKey,
    selectedServices,
    loadSkillSetup,
    onToggleService,
    onSaveNewSkills,
  } = useSkillManagerController({
    onSaveSuccess: () => {
      navigation.goBack();
    },
  });

  return (
    <GradientScreen
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
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

      <SplitGradientTitle
        prefix={APP_TEXT.profile.skillManager.addTitlePrefix}
        highlight={APP_TEXT.profile.skillManager.titleHighlight}
        subtitle={APP_TEXT.profile.skillManager.addSubtitle}
        showSparkle={false}
      />

      <View
        className="mt-4 rounded-2xl border px-3 py-3"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke,
          backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.noticeWarmLight,
        }}
      >
        <Text className="text-sm font-bold text-baseDark dark:text-white">
          {APP_TEXT.profile.skillManager.addMoreTitle}
        </Text>
        <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.profile.skillManager.addMoreSubtitle}
        </Text>
      </View>

      {loading ? (
        <View className="mt-8 items-center">
          <AppSpinner size="large" color={uiColors.onboarding.loader} />
        </View>
      ) : loadError ? (
        <View className="mt-5">
          <ListErrorState
            title={APP_TEXT.profile.skillManager.loadErrorTitle}
            description={APP_TEXT.profile.skillManager.loadErrorDescription}
            onAction={() => {
              void loadSkillSetup({ showFullScreenLoader: true });
            }}
          />
        </View>
      ) : categories.length === 0 ? (
        <View className="mt-5">
          <ListEmptyState
            icon="list-outline"
            title={APP_TEXT.profile.skillManager.emptyServicesTitle}
            description={APP_TEXT.profile.skillManager.emptyServicesDescription}
          />
        </View>
      ) : (
        <View className="mt-4">
          <WorkerSkillTreeSelector
            categories={categories}
            selectedServiceIds={selectedServiceIds}
            existingSkillsByKey={existingSkillsByKey}
            disabled={submitting}
            isDark={isDark}
            onToggleService={onToggleService}
          />
          <View className="mt-5">
            <WorkerSelectedSkillStrip
              selectedServices={selectedServices}
              disabled={submitting}
              isDark={isDark}
              onRemoveService={onToggleService}
            />
            <Button
              label={APP_TEXT.onboarding.vehicle.saveServicesButton}
              onPress={() => {
                void onSaveNewSkills();
              }}
              loading={submitting}
              disabled={submitting || selectedServices.length === 0}
            />
          </View>
        </View>
      )}
    </GradientScreen>
  );
}
