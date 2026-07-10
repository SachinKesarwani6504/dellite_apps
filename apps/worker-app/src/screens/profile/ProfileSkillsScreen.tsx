import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Switch, Text, View, useColorScheme } from 'react-native';
import { getWorkerStatus, updateWorkerServices } from '@/actions';
import { AppSpinner } from '@/components/common/AppSpinner';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { SkillCertificateStatusCard } from '@/components/common/SkillCertificateStatusCard';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { WorkerStatusData } from '@/types/auth';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import type { WorkerSkillStatusItem } from '@/types/worker-skills';
import { normalizeWorkerSkillStatus, titleCase } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';

export function ProfileSkillsScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.allSkills>) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<WorkerSkillStatusItem[]>([]);
  const [skillSummary, setSkillSummary] = useState<WorkerStatusData['summary'] | null>(null);
  const [skillsLoadError, setSkillsLoadError] = useState(false);
  const [activeBySkillId, setActiveBySkillId] = useState<Record<string, boolean>>({});
  const [togglingBySkillId, setTogglingBySkillId] = useState<Record<string, boolean>>({});

  const loadSkills = useCallback(async (options?: { showFullScreenLoader?: boolean }) => {
    const showFullScreenLoader = options?.showFullScreenLoader ?? true;
    if (showFullScreenLoader) {
      setLoading(true);
    }

    try {
      const status = await getWorkerStatus({ sortBy: 'status', direction: 'asc' });
      const nextSkills = Array.isArray(status.skills) ? (status.skills as WorkerSkillStatusItem[]) : [];
      setSkills(nextSkills);
      setSkillSummary(status.summary ?? null);
      setSkillsLoadError(false);
      setActiveBySkillId(prev => {
        const next: Record<string, boolean> = { ...prev };
        nextSkills.forEach(skill => {
          const skillId = skill.workerSkillId ?? skill.id;
          if (!skillId) return;
          next[skillId] = skill.isAvailable !== false;
        });
        return next;
      });
    } catch {
      setSkills([]);
      setSkillSummary(null);
      setSkillsLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadSkills({ showFullScreenLoader: true });
  }, [loadSkills]));

  const totalApproved = useMemo(
    () => skillSummary?.approvedSkills ?? skills.filter(skill => String(skill.status ?? '').toUpperCase() === 'APPROVED').length,
    [skillSummary?.approvedSkills, skills],
  );

  const totalSkills = skillSummary?.totalSkills ?? skills.length;

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    await loadSkills({ showFullScreenLoader: false });
  });

  const onToggleSkillAvailability = useCallback(async (skill: WorkerSkillStatusItem, nextIsAvailable: boolean) => {
    const skillId = skill.workerSkillId ?? skill.id;
    if (!skillId) return;
    if (togglingBySkillId[skillId]) return;

    setActiveBySkillId(prev => ({ ...prev, [skillId]: nextIsAvailable }));
    setTogglingBySkillId(prev => ({ ...prev, [skillId]: true }));
    try {
      await updateWorkerServices({
        workerSkillId: skillId,
        isAvailable: nextIsAvailable,
      });
      await loadSkills({ showFullScreenLoader: false });
    } catch {
      setActiveBySkillId(prev => ({ ...prev, [skillId]: !nextIsAvailable }));
      // API layer shows backend reason message directly via toast.
    } finally {
      setTogglingBySkillId(prev => ({ ...prev, [skillId]: false }));
    }
  }, [loadSkills, togglingBySkillId]);

  return (
    <GradientScreen
      contentContainerStyle={{ paddingBottom: 20 }}
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

        <View className="mt-1">
          <SplitGradientTitle
            prefix={APP_TEXT.profile.allSkills.titlePrefix}
            highlight={APP_TEXT.profile.allSkills.titleHighlight}
            subtitle={APP_TEXT.profile.allSkills.subtitle}
          />
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight }}>
            <Text className="text-xs uppercase tracking-wide text-textPrimary/70 dark:text-white/70">Total Skills</Text>
            <Text className="mt-1 text-2xl font-bold text-baseDark dark:text-white">{totalSkills}</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight }}>
            <Text className="text-xs uppercase tracking-wide text-textPrimary/70 dark:text-white/70">Approved</Text>
            <Text className="mt-1 text-2xl font-bold" style={{ color: theme.colors.positive }}>{totalApproved}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate(PROFILE_SCREENS.skillManager)}
          className="mt-4 flex-row items-center justify-center rounded-xl px-3 py-2.5"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Ionicons name="add-circle-outline" size={15} color={theme.colors.onPrimary} />
          <Text className="ml-1.5 text-sm font-semibold" style={{ color: theme.colors.onPrimary }}>
            {APP_TEXT.profile.allSkills.addSkillButton}
          </Text>
        </Pressable>

        <View className="mt-4">
          {loading ? (
            <View className="items-center py-8">
              <AppSpinner size="large" color={theme.colors.primary} />
            </View>
          ) : skillsLoadError ? (
            <ListErrorState
              title="Could not load skills"
              description="Pull to refresh or tap retry."
              onAction={() => {
                void loadSkills({ showFullScreenLoader: true });
              }}
            />
          ) : skills.length === 0 ? (
            <ListEmptyState
              icon="list-outline"
              title="No skills added yet."
              description="Add a skill to start receiving nearby jobs."
              actionLabel={APP_TEXT.profile.allSkills.addSkillButton}
              onAction={() => navigation.navigate(PROFILE_SCREENS.skillManager)}
            />
          ) : (
            <View>
              {skills.map((skill, index) => {
                const statusMeta = normalizeWorkerSkillStatus(skill.status);
                const name = skill.serviceName?.trim() || `Skill ${index + 1}`;
                const isCertificateRequired = skill.isCertificateRequired === true;
                const isCertificateAdded = skill.isCertificateAdded === true;
                const normalizedStatus = String(skill.status ?? '').trim().toUpperCase();
                const skillId = skill.workerSkillId ?? skill.id ?? `${name}-${index}`;
                const isAvailable = activeBySkillId[skillId] ?? (skill.isAvailable !== false);
                const isToggling = togglingBySkillId[skillId] === true;
                const certificateState = isCertificateRequired && !isCertificateAdded
                  ? 'required'
                  : isCertificateRequired && normalizedStatus === 'APPROVED'
                    ? 'approved'
                    : isCertificateRequired
                      ? 'pending'
                      : 'not_required';
                const certificateMessage = certificateState === 'required'
                  ? APP_TEXT.profile.allSkills.certificateRequiredLabel
                  : certificateState === 'approved'
                    ? APP_TEXT.profile.allSkills.certificateApprovedLabel
                    : certificateState === 'pending'
                      ? APP_TEXT.profile.allSkills.certificatePendingLabel
                      : APP_TEXT.profile.allSkills.noCertificateRequiredLabel;
                return (
                  <SkillCertificateStatusCard
                    key={skill.workerSkillId ?? skill.id ?? skill.serviceId ?? `${name}-${index}`}
                    title={titleCase(name)}
                    statusLabel={statusMeta.label}
                    statusColor={statusMeta.color}
                    statusIcon={statusMeta.icon}
                    certificateState={certificateState}
                    certificateMessage={certificateMessage}
                    addCertificateLabel={APP_TEXT.profile.allSkills.addCertificateButton}
                    extraContent={(
                      <View className="items-end">
                        <Text className="text-[10px] font-semibold uppercase tracking-wide text-textPrimary/60 dark:text-white/60">
                          {isAvailable ? APP_TEXT.profile.allSkills.activeLabel : APP_TEXT.profile.allSkills.inactiveLabel}
                        </Text>
                        <Switch
                          value={isAvailable}
                          onValueChange={(nextValue) => {
                            void onToggleSkillAvailability(skill, nextValue);
                          }}
                          disabled={isToggling}
                          trackColor={{ false: uiColors.surface.borderNeutralLight, true: theme.colors.primary }}
                          thumbColor={theme.colors.onPrimary}
                        />
                      </View>
                    )}
                    onAddCertificate={certificateState === 'required' ? () => navigation.navigate(PROFILE_SCREENS.certificateManager) : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>
    </GradientScreen>
  );
}
