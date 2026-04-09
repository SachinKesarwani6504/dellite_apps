import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';
import { AppSpinner } from '@/components/common/AppSpinner';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SectionCard } from '@/components/common/SectionCard';
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
  const { user, phone, logout, loading, refreshMe } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || APP_TEXT.profile.nameFallback;
  const initials = useMemo(() => {
    const first = String(user?.firstName ?? '').trim().charAt(0).toUpperCase();
    const last = String(user?.lastName ?? '').trim().charAt(0).toUpperCase();
    const value = `${first}${last}`.trim();
    return value || 'DP';
  }, [user?.firstName, user?.lastName]);
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
    return {
      totalSkills: toCount(source?.skillCount),
      completedJobs: toCount(source?.completedJobCount),
      certificates: toCount(source?.certificatesCount),
    };
  }, [user?.workerLink]);

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
        <Pressable
          onPress={() => navigation.navigate(PROFILE_SCREENS.editProfile)}
          className="flex-row items-center px-4 py-4"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
            <Ionicons name="settings-outline" size={18} color={theme.colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-baseDark dark:text-white">{APP_TEXT.profile.settingsTitle}</Text>
            <Text className="text-xs text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.settingsSubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? palette.dark.text : theme.colors.baseDark} />
        </Pressable>

        <View className="h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />

        <Pressable
          onPress={() => navigation.navigate(PROFILE_SCREENS.helpSupport)}
          className="flex-row items-center px-4 py-4"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
            <Ionicons name="help-buoy-outline" size={18} color={theme.colors.accent} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-baseDark dark:text-white">{APP_TEXT.profile.helpTitle}</Text>
            <Text className="text-xs text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.helpSubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? palette.dark.text : theme.colors.baseDark} />
        </Pressable>

        <View className="h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />

        <Pressable
          onPress={() => navigation.navigate(PROFILE_SCREENS.referral)}
          className="flex-row items-center px-4 py-4"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
            <Ionicons name="gift-outline" size={18} color={theme.colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-baseDark dark:text-white">{APP_TEXT.profile.referral.menuTitle}</Text>
            <Text className="text-xs text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.referral.menuSubtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? palette.dark.text : theme.colors.baseDark} />
        </Pressable>

        <View className="h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />

        <Pressable
          onPress={() => navigation.navigate(PROFILE_SCREENS.payoutDetails)}
          className="flex-row items-center px-4 py-4"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
            <Ionicons name="card-outline" size={18} color={theme.colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-baseDark dark:text-white">{APP_TEXT.profile.bankInfoButton}</Text>
            <Text className="text-xs text-textPrimary/70 dark:text-white/70">Manage UPI or bank payout details</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? palette.dark.text : theme.colors.baseDark} />
        </Pressable>

        <View className="h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />

        <Pressable
          onPress={() => navigation.navigate(PROFILE_SCREENS.allSkills)}
          className="flex-row items-center px-4 py-4"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
            <Ionicons name="list-outline" size={18} color={theme.colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-baseDark dark:text-white">{APP_TEXT.profile.allSkillsButton}</Text>
            <Text className="text-xs text-textPrimary/70 dark:text-white/70">See all registered skills</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? palette.dark.text : theme.colors.baseDark} />
        </Pressable>

        <View className="h-px" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />

        <Pressable
          onPress={() => {
            void logout();
          }}
          disabled={loading}
          className="flex-row items-center px-4 py-4"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-negative/12">
            {loading ? (
              <AppSpinner size="small" color={theme.colors.negative} />
            ) : (
              <Ionicons name="log-out-outline" size={18} color={theme.colors.negative} />
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-negative">{APP_TEXT.profile.logoutTitle}</Text>
            <Text className="text-xs text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.logoutSubtitle}</Text>
          </View>
        </Pressable>
      </View>
    </GradientScreen>
  );
}
