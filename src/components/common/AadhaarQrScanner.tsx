import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { palette, theme, uiColors } from '@/utils/theme';

type AadhaarQrScannerProps = {
  paused?: boolean;
  onDetected: (rawData: string, format?: string) => void;
};

export function AadhaarQrScanner({ paused = false, onDetected }: AadhaarQrScannerProps) {
  const isDark = useColorScheme() === 'dark';
  const [permission, requestPermission] = useCameraPermissions();

  const handleCode = (event: BarcodeScanningResult) => {
    if (!event?.data || paused) return;
    onDetected(event.data, event.type);
  };

  if (!permission) {
    return (
      <View className="h-72 items-center justify-center rounded-2xl border border-accent/40" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="rounded-2xl border border-accent/40 p-4" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}>
        <Text className="text-sm font-semibold text-baseDark dark:text-white">Camera permission required</Text>
        <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          Allow camera access to scan Aadhaar Secure QR for automatic verification.
        </Text>
        <Pressable
          onPress={() => {
            void requestPermission();
          }}
          className="mt-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2"
        >
          <Text className="text-center text-sm font-semibold text-primary">Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="h-72 overflow-hidden rounded-2xl border border-accent/40">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : handleCode}
      />
      <View className="absolute inset-0 items-center justify-center">
        <View className="h-44 w-44 rounded-2xl border-2 border-primary/70" />
      </View>
    </View>
  );
}
