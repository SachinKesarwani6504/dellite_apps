import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Platform, Text, View, useColorScheme } from 'react-native';
import { Button } from '@/components/common/Button';
import { APP_TEXT } from '@/utils/appText';
import { showToast } from '@/utils/toast';
import { palette, theme, uiColors } from '@/utils/theme';

type OfflineScreenProps = {
  onRetry: () => Promise<boolean>;
};

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  const isDark = useColorScheme() === 'dark';

  const handleOpenNetworkSettings = async () => {
    if (Platform.OS === 'android' && typeof Linking.sendIntent === 'function') {
      try {
        await Linking.sendIntent('android.settings.WIRELESS_SETTINGS');
        return;
      } catch {
        // Fallback below.
      }
    }

    if (Platform.OS === 'ios') {
      try {
        const canOpenWifiSettings = await Linking.canOpenURL('App-Prefs:root=WIFI');
        if (canOpenWifiSettings) {
          await Linking.openURL('App-Prefs:root=WIFI');
          return;
        }
      } catch {
        // Fallback below.
      }
    }

    await Linking.openSettings();
  };

  const handleRetry = async () => {
    const stillOffline = await onRetry();
    showToast(stillOffline ? 'warning' : 'success', stillOffline ? APP_TEXT.network.retryStillOffline : APP_TEXT.network.retryBackOnline);
  };

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? palette.dark.background : palette.light.background }}
    >
      <View
        className="mb-6 h-28 w-28 items-center justify-center rounded-full"
        style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
      >
        <MaterialCommunityIcons
          name="wifi-off"
          size={52}
          color={isDark ? uiColors.text.subtitleDark : theme.colors.primary}
        />
      </View>
      <Text className="text-center text-[28px] font-extrabold text-baseDark dark:text-white">
        {APP_TEXT.network.offlineTitle}
      </Text>
      <Text className="mt-2 text-center text-sm font-medium text-textMuted dark:text-textMutedDark">
        {APP_TEXT.network.offlineSubtitle}
      </Text>
      <View className="mt-7 w-full gap-3">
        <Button
          label={APP_TEXT.network.openSettingsButton}
          onPress={() => {
            void handleOpenNetworkSettings();
          }}
        />
        <Button
          label={APP_TEXT.network.retryButton}
          variant="secondary"
          onPress={() => {
            void handleRetry();
          }}
        />
      </View>
    </View>
  );
}
