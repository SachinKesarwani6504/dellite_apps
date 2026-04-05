import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View, useColorScheme } from 'react-native';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { useAuth } from '@/hooks/useAuth';
import { ProfileStackParamList } from '@/types/navigation';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export function ProfileHomeScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { user, phone, logout, loading } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <GradientScreen>
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.profile.title}</Text>
        <Text className="mt-2 text-textPrimary dark:text-white">
          {APP_TEXT.profile.phoneLabel} {(user?.phone ?? phone) || APP_TEXT.profile.phoneFallback}
        </Text>
        <Text className="mt-1 text-textPrimary dark:text-white">
          {APP_TEXT.profile.nameLabel} {displayName || APP_TEXT.profile.nameFallback}
        </Text>
        <View className="mt-5 gap-3">
          <Button
            label={APP_TEXT.profile.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
            disabled={loading}
            variant="secondary"
          />
          <Button
            label={APP_TEXT.profile.payoutDetailsButton}
            onPress={() => navigation.navigate('PayoutDetails')}
            disabled={loading}
            variant="secondary"
          />
          <Button
            label={APP_TEXT.profile.helpSupportButton}
            onPress={() => navigation.navigate('HelpSupport')}
            disabled={loading}
            variant="secondary"
          />
          <Button label={APP_TEXT.profile.logoutButton} onPress={logout} loading={loading} disabled={loading} />
        </View>
      </View>
    </GradientScreen>
  );
}

