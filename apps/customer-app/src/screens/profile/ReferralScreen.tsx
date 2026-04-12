import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SectionCard } from '@/components/common/SectionCard';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useApiGet } from '@/hooks/useApiGet';
import { useAuthContext } from '@/contexts/AuthContext';
import { REFERRAL_ROLES, type ReferralInfo, type ReferralMatrixEntry, type ReferralReward, type ReferralRole } from '@/types/auth';
import { formatTriggerEventLabel, rewardLabel, roleBadgeLabel, toNumber, worthLabel } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type InviteData = {
  referrerRole: ReferralRole;
  entry?: ReferralMatrixEntry;
};

type ReferralInfoResponseData = {
  referral?: ReferralInfo;
};

export function ReferralScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const { authState } = useAuthContext();
  const user = authState.user;
  const {
    data: referralResponse,
    loading: referralLoading,
    error: referralError,
    refetch: refetchReferralInfo,
  } = useApiGet<ReferralInfoResponseData>('/users/refferal-info');
  const referral = referralResponse?.referral ?? user?.referral;
  const roles = user?.roles;
  const referralCode = user?.referralCode || referral?.code || APP_TEXT.profile.referral.codeFallback;

  const oneCoinEqualsRupees = toNumber(referral?.coinConversion?.oneCoinEqualsRupees);
  const coinsPerRupee = oneCoinEqualsRupees && oneCoinEqualsRupees > 0 ? Math.round(1 / oneCoinEqualsRupees) : 4;

  const hasRole = (role: ReferralRole) => Boolean(roles?.[role]);
  const availableRoles = (referral?.availableReferrerRoles ?? []).filter(
    (role): role is ReferralRole => role === REFERRAL_ROLES.CUSTOMER || role === REFERRAL_ROLES.WORKER,
  );

  const pickReferrerRole = (referredRole: ReferralRole): ReferralRole => {
    if (hasRole(REFERRAL_ROLES.CUSTOMER) && hasRole(REFERRAL_ROLES.WORKER)) {
      return referredRole === REFERRAL_ROLES.CUSTOMER ? REFERRAL_ROLES.CUSTOMER : REFERRAL_ROLES.WORKER;
    }
    if (hasRole(REFERRAL_ROLES.CUSTOMER)) return REFERRAL_ROLES.CUSTOMER;
    if (hasRole(REFERRAL_ROLES.WORKER)) return REFERRAL_ROLES.WORKER;
    if (availableRoles.includes(REFERRAL_ROLES.CUSTOMER)) return REFERRAL_ROLES.CUSTOMER;
    if (availableRoles.includes(REFERRAL_ROLES.WORKER)) return REFERRAL_ROLES.WORKER;
    return REFERRAL_ROLES.CUSTOMER;
  };

  const getMatrixEntry = (referredRole: ReferralRole): InviteData => {
    const referrerRole = pickReferrerRole(referredRole);
    const key = `${referrerRole.charAt(0)}${referredRole.charAt(0)}`;
    const entry = referral?.signupRewardMatrix?.[key];
    return { referrerRole, entry };
  };

  const customerInvite = getMatrixEntry(REFERRAL_ROLES.CUSTOMER);
  const workerInvite = getMatrixEntry(REFERRAL_ROLES.WORKER);

  const cardStyle = {
    backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
    borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight,
  };

  const handleCopy = async () => {
    if (!referralCode || referralCode === APP_TEXT.profile.referral.codeFallback) {
      return;
    }
    await Clipboard.setStringAsync(referralCode);
  };

  const renderRewardRow = (
    label: string,
    reward: ReferralReward | undefined,
    icon: keyof typeof Ionicons.glyphMap,
    iconBackground: string,
    rightPill?: string | null,
  ) => (
    <View className="flex-row items-center py-1.5">
      <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: iconBackground }}>
        <Ionicons name={icon} size={14} color={theme.colors.onPrimary} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[11px] font-semibold uppercase text-textPrimary/70 dark:text-white/70">{label}</Text>
        <Text
          className="text-xl font-bold leading-6 text-baseDark dark:text-white"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {rewardLabel(reward)}
        </Text>
      </View>
      {rightPill ? (
        <View
          className="rounded-full px-2 py-1"
          style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.trackLight }}
        >
          <Text className="text-[10px] font-semibold text-textPrimary/70 dark:text-white/70">{rightPill}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderInviteBlock = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    referredRole: ReferralRole,
    data: InviteData,
  ) => {
    const referrerReward = data.entry?.referrerReward;
    const referredReward = data.entry?.referredReward;
    const referrerWorth = worthLabel(referrerReward, oneCoinEqualsRupees);
    const referrerTriggerPill = formatTriggerEventLabel(
      data.entry?.referrerTriggerEvent ?? data.entry?.triggerEvent ?? referral?.triggerEvent,
    );
    const triggerPill = formatTriggerEventLabel(
      data.entry?.referredTriggerEvent ?? data.entry?.triggerEvent ?? referral?.triggerEvent,
    );
    const referredLabel = referredRole === REFERRAL_ROLES.CUSTOMER
      ? APP_TEXT.profile.referral.newCustomerLabel
      : APP_TEXT.profile.referral.newWorkerLabel;

    return (
      <SectionCard
        containerClassName="mt-3"
        title={title}
        leftIcon={<Ionicons name={icon} size={14} color={theme.colors.primary} />}
        bodyClassName="px-3 py-2.5"
      >
        {renderRewardRow(
          roleBadgeLabel(data.referrerRole),
          referrerReward,
          'link-outline',
          theme.colors.primary,
          referrerWorth ?? referrerTriggerPill,
        )}

        <View className="my-1 flex-row items-center">
          <View className="h-px flex-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />
          <Text className="mx-3 text-[10px] font-semibold uppercase text-textPrimary/60 dark:text-white/60">{APP_TEXT.profile.referral.andLabel}</Text>
          <View className="h-px flex-1" style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }} />
        </View>

        {renderRewardRow(referredLabel, referredReward, 'sparkles-outline', theme.colors.accent, triggerPill)}
      </SectionCard>
    );
  };

  return (
    <GradientScreen contentContainerStyle={{ flexGrow: 1, paddingBottom: 28, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}>
      <View className="mb-3">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>

      <SplitGradientTitle
        prefix="Refer &"
        highlight="Earn"
        inline
        subtitle={APP_TEXT.profile.referral.pageSubtitle}
        prefixClassName="text-[32px] font-extrabold leading-[36px] text-baseDark dark:text-white"
        highlightClassName="text-[32px] font-extrabold leading-[36px]"
        subtitleClassName="mt-1 text-sm"
        showSparkle={false}
      />

      <View className="mt-4 overflow-hidden rounded-2xl" style={{ backgroundColor: theme.colors.primary }}>
        <View className="px-4 pb-8 pt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-extrabold" style={{ color: theme.colors.onPrimary }}>{APP_TEXT.profile.referral.heroTitle}</Text>
              <Text className="text-xs font-semibold" style={{ color: theme.colors.onPrimary }}>{APP_TEXT.profile.referral.heroSubtitle}</Text>
            </View>
            <Ionicons name="gift-outline" size={44} color={uiColors.surface.overlayLight90} />
          </View>
        </View>

        <View className="mx-3 -mt-4 mb-3 rounded-xl border px-3 py-2" style={{ backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card, borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.borderNeutralLight }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.primary }}>
                <Ionicons name="cash-outline" size={14} color={theme.colors.onPrimary} />
              </View>
              <View className="ml-2">
                <Text className="text-sm font-bold text-baseDark dark:text-white">{`${coinsPerRupee} Coins = Rs. 1`}</Text>
                <Text className="text-[11px] text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.referral.conversionSubtitle}</Text>
              </View>
            </View>
            <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
          </View>
        </View>
      </View>

      <Text className="mt-4 text-xs font-bold uppercase tracking-wide text-textPrimary/70 dark:text-white/70">
        {APP_TEXT.profile.referral.howItWorksTitle}
      </Text>

      {referralLoading && !referral ? (
        <View className="mt-3 flex-row items-center rounded-xl border px-3 py-2" style={cardStyle}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text className="ml-2 text-sm text-textPrimary/70 dark:text-white/70">Loading referral info...</Text>
        </View>
      ) : null}

      {referralError && !referral ? (
        <View className="mt-3 rounded-xl border px-3 py-2" style={cardStyle}>
          <Text className="text-sm text-negative">{referralError}</Text>
          <Pressable
            className="mt-2 self-start rounded-full px-3 py-1.5"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={() => {
              void refetchReferralInfo();
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: theme.colors.onPrimary }}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {renderInviteBlock(APP_TEXT.profile.referral.inviteCustomerTitle, 'person-outline', REFERRAL_ROLES.CUSTOMER, customerInvite)}
      {renderInviteBlock(APP_TEXT.profile.referral.inviteWorkerTitle, 'flash-outline', REFERRAL_ROLES.WORKER, workerInvite)}

      {referral?.bothRolesRule ? (
        <View
          className="mt-3 rounded-xl border px-3 py-2"
          style={{
            borderColor: isDark ? uiColors.toast.dark.warning.borderColor : uiColors.toast.light.warning.borderColor,
            backgroundColor: isDark ? uiColors.toast.dark.warning.backgroundColor : uiColors.toast.light.warning.backgroundColor,
          }}
        >
          <Text className="text-xs font-semibold" style={{ color: isDark ? uiColors.toast.dark.warning.textColor : uiColors.toast.light.warning.textColor }}>
            Both roles?
          </Text>
          <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.toast.dark.warning.textColor : uiColors.toast.light.warning.textColor }}>
            {referral.bothRolesRule}
          </Text>
        </View>
      ) : null}

      <View className="mt-4 rounded-2xl border p-3" style={cardStyle}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.colors.primary }}>
              <Ionicons name="gift-outline" size={18} color={theme.colors.onPrimary} />
            </View>
            <View className="ml-3">
              <Text className="text-[10px] font-semibold uppercase text-textPrimary/70 dark:text-white/70">{APP_TEXT.profile.referral.codeLabel}</Text>
              <Text className="text-2xl font-extrabold tracking-[4px] text-baseDark dark:text-white">{referralCode}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              void handleCopy();
            }}
            className="rounded-full px-4 py-2"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="text-sm font-semibold" style={{ color: theme.colors.onPrimary }}>{APP_TEXT.profile.referral.copyButton}</Text>
          </Pressable>
        </View>
      </View>
    </GradientScreen>
  );
}
