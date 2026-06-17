import { CommonActions, useNavigation } from '@react-navigation/native';
import { Text, useColorScheme } from 'react-native';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfileActionRow } from '@/components/common/ProfileActionRow';
import { SectionCard } from '@/components/common/SectionCard';
import { PROFILE_SCREEN } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';

export function SettingsScreen() {
  const navigation = useNavigation();
  const isDark = useColorScheme() === 'dark';

  return (
    <GradientScreen contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <DetailsTopBar onBack={() => navigation.goBack()} />
      <Text className="text-2xl font-extrabold text-baseDark dark:text-white">
        {APP_TEXT.profile.settings.title}
      </Text>
      <Text className="mt-1 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
        {APP_TEXT.profile.settings.subtitle}
      </Text>

      <SectionCard containerClassName="mt-4" bodyClassName="overflow-hidden">
        <ProfileActionRow
          title={APP_TEXT.profile.settings.notificationsTitle}
          subtitle={APP_TEXT.profile.settings.notificationsSubtitle}
          icon="notifications-outline"
          iconColor={theme.colors.primary}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          onPress={() => navigation.dispatch(CommonActions.navigate(PROFILE_SCREEN.NOTIFICATIONS))}
          showDivider
        />
        <ProfileActionRow
          title={APP_TEXT.profile.settings.locationTitle}
          subtitle={APP_TEXT.profile.settings.locationSubtitle}
          icon="location-outline"
          iconColor={theme.colors.accent}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          showChevron={false}
          showDivider
        />
        <ProfileActionRow
          title={APP_TEXT.profile.settings.securityTitle}
          subtitle={APP_TEXT.profile.settings.securitySubtitle}
          icon="shield-checkmark-outline"
          iconColor={theme.colors.primary}
          iconBackgroundColor={isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20}
          isDark={isDark}
          showChevron={false}
        />
      </SectionCard>
    </GradientScreen>
  );
}
