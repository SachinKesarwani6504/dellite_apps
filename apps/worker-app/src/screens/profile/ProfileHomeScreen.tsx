import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfileActionRow } from '@/components/common/ProfileActionRow';
import { SectionCard } from '@/components/common/SectionCard';
import { WorkerCurrentStatusBanner } from '@/components/common/WorkerCurrentStatusBanner';
import { useAuthContext } from '@/contexts/AuthContext';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { formatDateToDdMmmYyyy, getUserCreatedAt, toDisplayGender } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.home>;

type ProfileStats = {
  totalSkills: number;
  completedJobs: number;
  certificates: number;
};

export function ProfileHomeScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const { user, me, phone, logout, loading, refreshMe } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);

  const displayFirstName = typeof me?.user?.firstName === 'string' && me.user.firstName.trim().length > 0
    ? me.user.firstName.trim()
    : (typeof user?.firstName === 'string' ? user.firstName.trim() : '');
  const displayLastName = typeof me?.user?.lastName === 'string' && me.user.lastName.trim().length > 0
    ? me.user.lastName.trim()
    : (typeof user?.lastName === 'string' ? user.lastName.trim() : '');
  const displayName = [displayFirstName, displayLastName].filter(Boolean).join(' ') || APP_TEXT.profile.nameFallback;
  const initials = useMemo(() => {
    const first = String(displayFirstName ?? '').trim().charAt(0).toUpperCase();
    const last = String(displayLastName ?? '').trim().charAt(0).toUpperCase();
    const value = `${first}${last}`.trim();
    return value || 'DP';
  }, [displayFirstName, displayLastName]);
  const genderLabel = toDisplayGender(user?.gender, 'Not set');
  const roleLabel = APP_TEXT.profile.roleLabel;
  const memberSinceDate = formatDateToDdMmmYyyy(getUserCreatedAt(user));
  const memberSince = `${APP_TEXT.profile.memberSincePrefix} ${memberSinceDate}`;
  const contactPhone = (user?.phone ?? phone) || APP_TEXT.profile.phoneFallback;
  const contactEmail = typeof user?.email === 'string' && user.email.trim() ? user.email : APP_TEXT.profile.notProvided;
  const verificationValue = user?.userIdentityVerification?.isVerified;
  const isVerified = verificationValue === true
    || verificationValue === 1
    || String(verificationValue ?? '').trim().toLowerCase() === 'true';
  const stats = useMemo<ProfileStats>(() => {
    const source = user?.workerLink;
    const toCount = (value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return 0;
    };
    const toOptionalCount = (value: unknown) => {
      if (value === null || typeof value === 'undefined') return null;
      const parsed = toCount(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const workerLinkFromMe = me?.links?.worker as Record<string, unknown> | undefined;
    const roleLinkFromMe = (me as Record<string, unknown> | null | undefined)?.roleLink as Record<string, unknown> | undefined;
    const approvedServicesFromLinks = workerLinkFromMe?.approvedServices;
    const approvedServicesFromRoleLink = roleLinkFromMe?.approvedServices;
    const approvedSkillsFromLinks = workerLinkFromMe?.approvedSkills;
    const approvedSkillsFromRoleLink = roleLinkFromMe?.approvedSkills;
    const totalSkillsFromApprovedCollections =
      (Array.isArray(approvedServicesFromLinks) ? approvedServicesFromLinks.length : null)
      ?? (Array.isArray(approvedServicesFromRoleLink) ? approvedServicesFromRoleLink.length : null)
      ?? (Array.isArray(approvedSkillsFromLinks) ? approvedSkillsFromLinks.length : null)
      ?? (Array.isArray(approvedSkillsFromRoleLink) ? approvedSkillsFromRoleLink.length : null);
    const totalSkillsFromMeCount =
      toOptionalCount(workerLinkFromMe?.skillCount)
      ?? toOptionalCount(roleLinkFromMe?.skillCount)
      ?? toOptionalCount(roleLinkFromMe?.totalSkills);
    return {
      totalSkills: totalSkillsFromApprovedCollections ?? totalSkillsFromMeCount ?? toCount(source?.skillCount),
      completedJobs: toCount(source?.completedJobCount),
      certificates: toCount(source?.certificatesCount),
    };
  }, [me, user?.workerLink]);
  const currentStatus = useMemo(() => {
    const toBoolean = (value: unknown): boolean | undefined => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1 ? true : (value === 0 ? false : undefined);
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
      }
      return undefined;
    };

    const normalizeCurrentStatus = (value: unknown) => {
      if (!value || typeof value !== 'object') return null;
      const raw = value as Record<string, unknown>;
      return {
        id: typeof raw.id === 'string' ? raw.id : undefined,
        workerId: typeof raw.workerId === 'string' ? raw.workerId : (typeof raw.worker_id === 'string' ? raw.worker_id : undefined),
        status: typeof raw.status === 'string' ? raw.status : undefined,
        isLatest: toBoolean(raw.isLatest ?? raw.is_latest),
        message: typeof raw.message === 'string' ? raw.message : undefined,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : (typeof raw.created_at === 'string' ? raw.created_at : undefined),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : (typeof raw.updated_at === 'string' ? raw.updated_at : undefined),
      };
    };

    const linksWorker = me?.links?.worker as Record<string, unknown> | undefined;
    const roleLink = (me as Record<string, unknown> | undefined)?.roleLink as Record<string, unknown> | undefined;
    const candidates: unknown[] = [
      linksWorker?.currentStatus,
      linksWorker?.current_status,
      roleLink?.currentStatus,
      roleLink?.current_status,
      user?.workerLink?.currentStatus,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
      const normalized = normalizeCurrentStatus(candidates[index]);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }, [me, user?.workerLink?.currentStatus]);
  const shouldShowCurrentStatusBanner = useMemo(() => {
    const status = String(currentStatus?.status ?? '').trim().toUpperCase();
    return Boolean(status) && status !== APP_TEXT.home.currentStatusActiveValue;
  }, [currentStatus?.status]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshMe();
    } finally {
      setRefreshing(false);
    }
  }, [refreshMe, refreshing]);

  const cardStyle = {
    backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
  };
  const mutedCardStyle = {
    backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight,
    borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight,
  };

  return (
    <GradientScreen
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={refreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
          {...refreshProps}
        />
      )}
    >
      <View className="overflow-hidden rounded-3xl border" style={cardStyle}>
        <LinearGradient
          colors={theme.gradients.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 110 }}
        />

        <View className="items-center px-5 pb-5">
          <View className="-mt-12 relative">
            <View
              className="h-24 w-24 items-center justify-center rounded-full border-4 bg-primary"
              style={{ borderColor: isDark ? theme.colors.baseDark : theme.colors.onPrimary }}
            >
              <Text className="text-3xl font-extrabold" style={{ color: theme.colors.onPrimary }}>{initials}</Text>
            </View>
            {isVerified ? (
              <View
                className="absolute -right-0.5 top-0 h-7 w-7 items-center justify-center rounded-full border-2"
                style={{ borderColor: theme.colors.onPrimary, backgroundColor: theme.colors.accent }}
              >
                <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />
              </View>
            ) : null}
            <View
              className="absolute -bottom-0.5 right-1 h-7 w-7 items-center justify-center rounded-full border bg-primary/90"
              style={{ borderColor: theme.colors.onPrimary }}
            >
              <Ionicons name="camera-outline" size={14} color={theme.colors.onPrimary} />
            </View>
          </View>

          <Text className="mt-3 text-center text-[28px] font-extrabold text-baseDark dark:text-white">
            {displayName}
          </Text>

          <View className="mt-2 flex-row items-center gap-2">
            <View className="flex-row items-center rounded-full px-3 py-1" style={mutedCardStyle}>
              <Ionicons name="person-circle-outline" size={13} color={theme.colors.primary} />
              <Text className="ml-1 text-xs font-semibold text-primary">{roleLabel}</Text>
            </View>
            <View className="flex-row items-center rounded-full px-3 py-1" style={mutedCardStyle}>
              <Ionicons name="male-female-outline" size={13} color={isDark ? palette.dark.text : theme.colors.baseDark} />
              <Text className="ml-1 text-xs font-semibold text-textPrimary dark:text-white">{genderLabel}</Text>
            </View>
          </View>

          <Text className="mt-2 text-sm text-textPrimary/70 dark:text-white/70">{memberSince}</Text>

          <Pressable
            onPress={() => navigation.navigate(PROFILE_SCREENS.editProfile)}
            className="mt-4 rounded-full px-6 py-2.5"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="create-outline" size={14} color={theme.colors.onPrimary} />
              <Text className="text-sm font-semibold" style={{ color: theme.colors.onPrimary }}>Edit Profile</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {shouldShowCurrentStatusBanner ? (
        <WorkerCurrentStatusBanner currentStatus={currentStatus} />
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 items-center rounded-2xl border p-4" style={cardStyle}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Ionicons name="briefcase-outline" size={18} color={theme.colors.primary} />
          </View>
          <Text className="mt-3 text-center text-2xl font-bold text-baseDark dark:text-white">
            {stats.totalSkills}
          </Text>
          <Text className="text-center text-xs text-textPrimary/70 dark:text-white/70">Skills</Text>
        </View>

        <View className="flex-1 items-center rounded-2xl border p-4" style={cardStyle}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.positive} />
          </View>
          <Text className="mt-3 text-center text-2xl font-bold text-baseDark dark:text-white">
            {stats.completedJobs}
          </Text>
          <Text className="text-center text-xs text-textPrimary/70 dark:text-white/70">Completed</Text>
        </View>

        <View className="flex-1 items-center rounded-2xl border p-4" style={cardStyle}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Ionicons name="ribbon-outline" size={18} color={theme.colors.accent} />
          </View>
          <Text className="mt-3 text-center text-2xl font-bold text-baseDark dark:text-white">
            {stats.certificates}
          </Text>
          <Text className="text-center text-xs text-textPrimary/70 dark:text-white/70">Certificates</Text>
        </View>
      </View>

      <SectionCard
        containerClassName="mt-4"
        title={APP_TEXT.profile.contactInfoTitle}
        bodyClassName="p-3"
      >
        <View className="gap-2">
          <View className="rounded-xl border p-3" style={mutedCardStyle}>
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.phoneLabel}</Text>
            <Text className="mt-0.5 text-base font-semibold text-baseDark dark:text-white">{contactPhone}</Text>
          </View>
          <View className="rounded-xl border p-3" style={mutedCardStyle}>
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.emailLabel}</Text>
            <Text className="mt-0.5 text-base font-semibold text-baseDark dark:text-white">{contactEmail}</Text>
          </View>
        </View>
      </SectionCard>

      <View className="mt-4 overflow-hidden rounded-2xl border" style={cardStyle}>
        <ProfileActionRow
          title={APP_TEXT.profile.helpTitle}
          subtitle={APP_TEXT.profile.helpSubtitle}
          icon="help-buoy-outline"
          iconColor={theme.colors.accent}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          onPress={() => navigation.navigate(PROFILE_SCREENS.helpSupport)}
          showDivider
        />

        <ProfileActionRow
          title={APP_TEXT.profile.referral.menuTitle}
          subtitle={APP_TEXT.profile.referral.menuSubtitle}
          icon="gift-outline"
          iconColor={theme.colors.primary}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          onPress={() => navigation.navigate(PROFILE_SCREENS.referral)}
          showDivider
        />

        <ProfileActionRow
          title={APP_TEXT.profile.bankInfoButton}
          subtitle="Manage UPI or bank payout details"
          icon="card-outline"
          iconColor={theme.colors.primary}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          onPress={() => navigation.navigate(PROFILE_SCREENS.payoutDetails)}
          showDivider
        />

        <ProfileActionRow
          title={APP_TEXT.profile.allSkillsButton}
          subtitle="See all registered skills"
          icon="list-outline"
          iconColor={theme.colors.primary}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          onPress={() => navigation.navigate(PROFILE_SCREENS.allSkills)}
          showDivider
        />

        <ProfileActionRow
          title={APP_TEXT.profile.logoutTitle}
          subtitle={APP_TEXT.profile.logoutSubtitle}
          icon="log-out-outline"
          iconColor={theme.colors.negative}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          titleColor={theme.colors.negative}
          isDark={isDark}
          loading={loading}
          disabled={loading}
          onPress={() => {
            void logout();
          }}
        />
      </View>
    </GradientScreen>
  );
}
