import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.helpSupport>;

export function HelpSupportScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  return (
    <GradientScreen>
      <View className="mb-4">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.profile.helpSupport.title}</Text>
        <Text className="mt-3 text-textPrimary dark:text-white">{APP_TEXT.profile.helpSupport.subtitle}</Text>
      </View>
    </GradientScreen>
  );
}

