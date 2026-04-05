import { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { Button } from '@/components/common/Button';
import { AppInput } from '@/components/common/AppInput';
import { GradientScreen } from '@/components/common/GradientScreen';
import { APP_TEXT } from '@/utils/appText';
import { palette } from '@/utils/theme';

export function EditProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <GradientScreen>
      <View className="rounded-2xl border border-accent/40 dark:border-white/10 p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card }}>
        <Text className="text-2xl font-bold text-textPrimary dark:text-white">{APP_TEXT.profile.edit.title}</Text>
        <View className="mt-4 gap-3">
          <AppInput value={name} onChangeText={setName} placeholder={APP_TEXT.profile.edit.fullNamePlaceholder} />
          <AppInput
            value={email}
            onChangeText={setEmail}
            placeholder={APP_TEXT.profile.edit.emailPlaceholder}
            keyboardType="email-address"
          />
        </View>
        <View className="mt-5">
          <Button label={APP_TEXT.profile.edit.saveButton} onPress={() => undefined} disabled />
        </View>
      </View>
    </GradientScreen>
  );
}

