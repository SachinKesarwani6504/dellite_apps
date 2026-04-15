import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, RefreshControl, Text, View, useColorScheme } from 'react-native';

import { useBrandRefreshControl } from '@/components/common/BrandRefreshControl';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfileActionRow } from '@/components/common/ProfileActionRow';
import { SectionCard } from '@/components/common/SectionCard';
import { formatDateToDdMmmYyyy, getUserCreatedAt, palette, theme, toDisplayGender, uiColors } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { useAuthContext } from '@/contexts/AuthContext';
import { PROFILE_SCREEN } from '@/types/screen-names';

export function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const { authState, logout, loading, refreshMe } = useAuthContext();
  const navigation = useNavigation();
  const user = authState.user;
  const refreshControlProps = useBrandRefreshControl(async () => {
    await refreshMe();
  });

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || APP_TEXT.profile.nameFallback;
  const initials = useMemo(() => {
    const first = String(user?.firstName ?? '').trim().charAt(0).toUpperCase();
    const last = String(user?.lastName ?? '').trim().charAt(0).toUpperCase();
    const value = `${first}${last}`.trim();
    return value || 'DC';
  }, [user?.firstName, user?.lastName]);

  const contactPhone = user?.phone || APP_TEXT.profile.phoneFallback;
  const contactEmail = user?.email || APP_TEXT.profile.notProvided;
  const genderLabel = useMemo(() => toDisplayGender(user?.gender, APP_TEXT.profile.notProvided), [user?.gender]);
  const memberSince = `${APP_TEXT.profile.memberSincePrefix} ${formatDateToDdMmmYyyy(getUserCreatedAt(user))}`;

  const onboarding = user?.onboarding;
  const stats = useMemo(() => {
    const completed = onboarding?.isBasicInfoCompleted ? 1 : 0;
    return {
      bookings: completed ? 1 : 0,
      active: authState.status === 'authenticated' ? 1 : 0,
      completed,
    };
  }, [authState.status, onboarding?.isBasicInfoCompleted]);

  const cardStyle = {
    backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
  };
  const mutedCardStyle = {
    backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight,
    borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight,
  };

  const handleRefresh = useCallback(async () => {
    await refreshMe();
  }, [refreshMe]);

  return (
    <GradientScreen
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
      refreshControl={(
        <RefreshControl
          refreshing={refreshControlProps.refreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
          tintColor={refreshControlProps.tintColor}
          colors={refreshControlProps.colors}
          progressBackgroundColor={refreshControlProps.progressBackgroundColor}
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
              <Text className="ml-1 text-xs font-semibold text-primary">{APP_TEXT.profile.roleLabel}</Text>
            </View>
            <View className="flex-row items-center rounded-full px-3 py-1" style={mutedCardStyle}>
              <Ionicons name="male-female-outline" size={13} color={isDark ? palette.dark.text : theme.colors.baseDark} />
              <Text className="ml-1 text-xs font-semibold text-textPrimary dark:text-white">{genderLabel}</Text>
            </View>
          </View>

          <Text className="mt-2 text-sm text-textPrimary/70 dark:text-white/70">{memberSince}</Text>

          <Pressable
            disabled={loading}
            onPress={() => {
              if (loading) {
                return;
              }
              navigation.navigate(PROFILE_SCREEN.EDIT_PROFILE);
            }}
            className={`mt-4 rounded-full px-6 py-2.5 ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: theme.colors.primary }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="create-outline" size={14} color={theme.colors.onPrimary} />
              <Text className="text-sm font-semibold" style={{ color: theme.colors.onPrimary }}>
                {APP_TEXT.profile.editProfileButton}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 items-center rounded-2xl border p-4" style={cardStyle}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
          </View>
          <Text className="mt-3 text-center text-2xl font-bold text-baseDark dark:text-white">
            {stats.bookings}
          </Text>
          <Text className="text-center text-xs text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.stats.bookings}</Text>
        </View>

        <View className="flex-1 items-center rounded-2xl border p-4" style={cardStyle}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Ionicons name="time-outline" size={18} color={theme.colors.positive} />
          </View>
          <Text className="mt-3 text-center text-2xl font-bold text-baseDark dark:text-white">
            {stats.active}
          </Text>
          <Text className="text-center text-xs text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.stats.active}</Text>
        </View>

        <View className="flex-1 items-center rounded-2xl border p-4" style={cardStyle}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.accent} />
          </View>
          <Text className="mt-3 text-center text-2xl font-bold text-baseDark dark:text-white">
            {stats.completed}
          </Text>
          <Text className="text-center text-xs text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.stats.completed}</Text>
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
          showDivider
        />

        <ProfileActionRow
          title={APP_TEXT.profile.referral.menuTitle}
          subtitle={APP_TEXT.profile.referral.menuSubtitle}
          icon="gift-outline"
          iconColor={theme.colors.primary}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          onPress={() => navigation.navigate(PROFILE_SCREEN.REFERRAL)}
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
          showChevron={false}
          onPress={() => {
            void logout();
          }}
        />
      </View>
    </GradientScreen>
  );
}

