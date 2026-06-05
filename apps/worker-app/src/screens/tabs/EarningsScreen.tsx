import { Text, View, useColorScheme } from 'react-native';
import { PermissionPromptCard } from '@/components/common/PermissionPromptCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { GradientScreen } from '@/components/common/GradientScreen';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

export function EarningsScreen() {
  const isDark = useColorScheme() === 'dark';
  const { locationState } = useAuthContext();
  const { permissionStatus, initializeLocation, requestLocationPermission } = locationState;
  const shouldShowLocationPrompt = permissionStatus !== 'granted';

  const handleLocationPermissionAction = async () => {
    const status = await requestLocationPermission();
    if (status === 'granted') {
      await initializeLocation({ forceRefresh: true });
    }
  };

  return (
    <GradientScreen>
      {shouldShowLocationPrompt ? (
        <View className="mb-4">
          <PermissionPromptCard
            tone="location"
            title={APP_TEXT.home.locationAccess.title}
            subtitle={APP_TEXT.home.locationAccess.subtitle}
            actionLabel={APP_TEXT.home.locationAccess.actionLabel}
            onAction={() => {
              void handleLocationPermissionAction();
            }}
            helperText={APP_TEXT.home.locationAccess.helpText}
          />
        </View>
      ) : null}
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.earnings.title}</Text>
        <Text className="mt-2 text-textPrimary dark:text-white">
          {APP_TEXT.earnings.subtitle}
        </Text>
      </View>
    </GradientScreen>
  );
}

