import { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { Button } from '@/components/common/Button';
import { AppInput } from '@/components/common/AppInput';
import { GradientScreen } from '@/components/common/GradientScreen';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

export function PayoutDetailsScreen() {
  const isDark = useColorScheme() === 'dark';
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  return (
    <GradientScreen>
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.profile.payout.title}</Text>
        <View className="mt-4 gap-3">
          <AppInput
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder={APP_TEXT.profile.payout.accountPlaceholder}
          />
          <AppInput
            value={ifsc}
            onChangeText={setIfsc}
            placeholder={APP_TEXT.profile.payout.ifscPlaceholder}
            autoCapitalize="characters"
          />
        </View>
        <View className="mt-5">
          <Button label={APP_TEXT.profile.payout.updateButton} onPress={() => undefined} disabled />
        </View>
      </View>
    </GradientScreen>
  );
}

