import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Switch, Text, View, useColorScheme } from 'react-native';
import { getWorkerStatus, updateWorkerServices } from '@/actions';
import { AppSpinner } from '@/components/common/AppSpinner';
import { BackButton } from '@/components/common/BackButton';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { GradientWord } from '@/components/common/GradientWord';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ListErrorState } from '@/components/common/ListErrorState';
import { SkillCertificateStatusCard } from '@/components/common/SkillCertificateStatusCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { normalizeWorkerSkillStatus, titleCase } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.allSkills>;

type WorkerSkill = {
  id?: string;
  workerSkillId?: string;
  workerServiceId?: string;
  serviceId?: string;
  serviceName?: string;
  status?: string;
  isCertificateRequired?: boolean;
  isCertificateAdded?: boolean;
  isAvailable?: boolean;
};

export function ProfileSkillsScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const { me } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [skills, setSkills] = useState<WorkerSkill[]>([]);
  const [skillsLoadError, setSkillsLoadError] = useState(false);
  const [activeBySkillId, setActiveBySkillId] = useState<Record<string, boolean>>({});
  const [togglingBySkillId, setTogglingBySkillId] = useState<Record<string, boolean>>({});

  const loadSkills = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const status = await getWorkerStatus({ sortBy: 'status', direction: 'asc' });
      const nextSkills = Array.isArray(status.skills) ? (status.skills as WorkerSkill[]) : [];
      setSkills(nextSkills);
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
      setSkillsLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSkills(false);
  }, [loadSkills]);

  useFocusEffect(useCallback(() => {
    void loadSkills(false);
  }, [loadSkills]));

  const totalApproved = useMemo(
    () => skills.filter(skill => String(skill.status ?? '').toUpperCase() === 'APPROVED').length,
    [skills],
  );

  const totalSkillsFromMe = useMemo(() => {
    const parseCount = (value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      return null;
    };
    const approvedServices = (me?.links?.worker as Record<string, unknown> | undefined)?.approvedServices;
    if (Array.isArray(approvedServices)) {
      return approvedServices.length;
    }
    const parsedSkillCount = parseCount(me?.links?.worker?.skillCount as unknown);
    if (parsedSkillCount !== null) return parsedSkillCount;
    return skills.length;
  }, [me?.links?.worker, skills.length]);

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    void loadSkills(true);
  }, [loadSkills, refreshing]);

  const onToggleSkillAvailability = useCallback(async (skill: WorkerSkill, nextIsAvailable: boolean) => {
    const skillId = skill.workerSkillId ?? skill.id;
    if (!skillId) return;
    if (togglingBySkillId[skillId]) return;

    setActiveBySkillId(prev => ({ ...prev, [skillId]: nextIsAvailable }));
    setTogglingBySkillId(prev => ({ ...prev, [skillId]: true }));
    try {
      await updateWorkerServices({
        workerSkillId: skillId,
        workerServiceId: skill.workerServiceId,
        isAvailable: nextIsAvailable,
      });
    } catch {
      setActiveBySkillId(prev => ({ ...prev, [skillId]: !nextIsAvailable }));
      // API layer shows backend reason message directly via toast.
    } finally {
      setTogglingBySkillId(prev => ({ ...prev, [skillId]: false }));
    }
  }, [togglingBySkillId]);

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
        <View className="mb-4">
          <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
        </View>

        <View className="mt-1">
          <Text className="text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white">All</Text>
          <GradientWord word="Skills" className="text-4xl font-extrabold leading-[40px]" />
          <Text className="mt-1 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {APP_TEXT.profile.allSkills.subtitle}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight }}>
            <Text className="text-xs uppercase tracking-wide text-textPrimary/70 dark:text-white/70">Total Skills</Text>
            <Text className="mt-1 text-2xl font-bold text-baseDark dark:text-white">{totalSkillsFromMe}</Text>
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
                void loadSkills(false);
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
