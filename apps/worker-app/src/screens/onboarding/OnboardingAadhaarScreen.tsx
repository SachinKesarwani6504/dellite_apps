import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import { GradientScreen } from '@/components/common/GradientScreen';
import { AadhaarQrScanner } from '@/components/common/AadhaarQrScanner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboardingScreenGuard } from '@/hooks/useOnboarding';
import { useAadhaarQrVerification } from '@/hooks/useAadhaarQrVerification';
import { OnboardingStackParamList } from '@/types/navigation';
import { ONBOARDING_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { APP_LAYOUT } from '@/utils/layout';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingAadhaar'>;

export function OnboardingAadhaarScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { loading } = useAuthContext();

  const {
    phase,
    error,
    parsedData,
    isScannerPaused,
    onQrScanned,
    verifyScannedData,
    resetScan,
  } = useAadhaarQrVerification();

  useOnboardingScreenGuard({
    currentRoute: ONBOARDING_SCREENS.aadhaar,
    onRedirect: route => navigation.replace(route),
    refreshOnMount: true,
  });

  const statusMeta = useMemo(() => {
    if (phase === 'verifying') {
      return {
        label: 'Verification in progress',
        subtitle: 'Validating Aadhaar Secure QR with backend.',
        icon: 'hourglass-outline' as const,
      };
    }
    if (phase === 'verified') {
      return {
        label: 'Aadhaar verified successfully',
        subtitle: 'Redirecting to next onboarding step.',
        icon: 'checkmark-circle-outline' as const,
      };
    }
    if (phase === 'failed') {
      return {
        label: 'Verification failed',
        subtitle: error ?? 'Scan again and verify with a valid Aadhaar Secure QR.',
        icon: 'alert-circle-outline' as const,
      };
    }
    if (phase === 'scanned') {
      return {
        label: 'QR scanned',
        subtitle: 'Review details and continue to secure verification.',
        icon: 'qr-code-outline' as const,
      };
    }
    return {
      label: 'Ready to scan',
      subtitle: 'Place Aadhaar Secure QR inside the frame.',
      icon: 'scan-outline' as const,
    };
  }, [error, phase]);

  const onBackStep = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  return (
    <GradientScreen contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingHorizontal: APP_LAYOUT.screenHorizontalPadding }}>
      <View className="rounded-3xl px-4 pb-5 pt-4" style={{ backgroundColor: isDark ? uiColors.surface.cardElevatedDark : palette.light.card }}>
        <BackButton onPress={onBackStep} visible={navigation.canGoBack()} />
        <Text className="mt-3 text-xs font-bold tracking-widest text-primary">{APP_TEXT.onboarding.aadhaar.step}</Text>
        <Text className="mt-2 text-4xl font-extrabold leading-[40px] text-baseDark dark:text-white">
          {APP_TEXT.onboarding.aadhaar.title}
        </Text>
        <Text className="mt-2 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.onboarding.aadhaar.subtitle}
        </Text>

        <View className="mt-4 rounded-2xl border px-3 py-3" style={{ borderColor: theme.colors.accent, backgroundColor: uiColors.surface.accentSoft20 }}>
          <View className="flex-row items-start">
            <View className="mr-2 mt-0.5 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.onPrimary }}>
              <Ionicons name={statusMeta.icon} size={15} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold" style={{ color: theme.colors.primary }}>{statusMeta.label}</Text>
              <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                {statusMeta.subtitle}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4">
          <AadhaarQrScanner paused={isScannerPaused} onDetected={onQrScanned} />
        </View>

        {parsedData ? (
          <View className="mt-4 rounded-2xl border border-accent/40 px-3 py-3" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
            <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
              Parsed QR Preview
            </Text>
            {parsedData.fullName ? (
              <Text className="mt-2 text-sm font-semibold text-baseDark dark:text-white">Name: {parsedData.fullName}</Text>
            ) : null}
            {parsedData.dateOfBirth ? (
              <Text className="mt-1 text-sm text-baseDark dark:text-white">DOB: {parsedData.dateOfBirth}</Text>
            ) : null}
            {parsedData.gender ? (
              <Text className="mt-1 text-sm text-baseDark dark:text-white">Gender: {parsedData.gender}</Text>
            ) : null}
            {parsedData.aadhaarLast4 ? (
              <Text className="mt-1 text-sm text-baseDark dark:text-white">Aadhaar: XXXX XXXX {parsedData.aadhaarLast4}</Text>
            ) : null}
          </View>
        ) : null}

      </View>

      <View className="mt-5 gap-3">
        <Button
          label={phase === 'verifying' ? 'Verifying Aadhaar...' : 'Verify Aadhaar QR'}
          onPress={() => {
            void verifyScannedData();
          }}
          loading={phase === 'verifying' || loading}
          disabled={phase !== 'scanned' && phase !== 'failed'}
        />
        <Pressable
          onPress={resetScan}
          disabled={phase === 'verifying'}
          className="rounded-xl border border-accent/40 px-4 py-3"
          style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}
        >
          <Text className="text-center text-sm font-semibold text-baseDark dark:text-white">Scan Again</Text>
        </Pressable>
      </View>
    </GradientScreen>
  );
}
