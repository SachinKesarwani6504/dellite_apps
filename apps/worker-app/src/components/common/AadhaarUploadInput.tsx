import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View, useColorScheme } from 'react-native';
import { palette, theme, uiColors } from '@/utils/theme';

type AadhaarUploadInputProps = {
  label: string;
  fileName?: string | null;
  previewUri?: string | null;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  showPreview?: boolean;
  emptyHint?: string;
  maxSizeHint?: string;
  iconName?: 'document-attach-outline' | 'document-text-outline';
};

export function AadhaarUploadInput({
  label,
  fileName,
  previewUri,
  onPress,
  disabled = false,
  isLoading = false,
  required = false,
  showPreview = true,
  emptyHint = 'PNG, JPG only • Max 5MB',
  maxSizeHint = 'PNG, JPG only • Max 5MB',
  iconName = 'document-attach-outline',
}: AadhaarUploadInputProps) {
  const isDark = useColorScheme() === 'dark';
  const hasFile = Boolean(fileName?.trim().length);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`rounded-2xl border border-dashed p-3 ${(disabled || isLoading) ? 'opacity-60' : ''}`}
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.trackLight,
      }}
    >
      <View className="flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
          <Ionicons name={iconName} size={18} color={theme.colors.primary} />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
              {label}
            </Text>
            {required ? (
              <Text className="ml-1 text-sm font-semibold" style={{ color: theme.colors.negative }}>*</Text>
            ) : null}
          </View>
          <Text className="mt-0.5 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
            {hasFile ? fileName : emptyHint}
          </Text>
        </View>
        <Text className="text-xs font-semibold text-primary">
          {isLoading ? 'Adding...' : hasFile ? 'Update File' : 'Upload File'}
        </Text>
      </View>

      {showPreview && previewUri ? (
        <View
          className="mt-3 overflow-hidden rounded-xl border"
          style={{
            borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
            backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
          }}
        >
          <View className="px-2 pt-2">
            <Text className="text-[11px] font-semibold" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
              Full Preview
            </Text>
          </View>
          <Image
            source={{ uri: previewUri }}
            resizeMode="contain"
            style={{ width: '100%', height: 220, marginTop: 4, marginBottom: 6 }}
          />
        </View>
      ) : (
        <Text className="mt-2 text-[11px]" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
          {maxSizeHint}
        </Text>
      )}
    </Pressable>
  );
}
