import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import type { FileUploadCardProps } from '@/types/component-types';
import type { UploadPreviewFile } from '@/types/file-upload';
import { isImageFile, isPdfFile } from '@/utils/file-upload';
import { palette, theme, uiColors } from '@/utils/theme';

export function FileUploadCard({
  files,
  onPress,
  disabled = false,
  isPicking = false,
  isDark,
  isRequired = false,
  multiple = false,
  iconName = 'cloud-upload-outline',
  idleTitle = 'Tap to upload',
  pickingTitle = 'Adding file...',
  description = 'or drag and drop your file here',
  helperText = 'PDF, JPG, PNG up to 5MB',
  maxPreviewItems = 3,
}: FileUploadCardProps) {
  const visibleFiles = files.slice(0, Math.max(1, maxPreviewItems));
  const extraCount = Math.max(0, files.length - visibleFiles.length);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="mt-3 items-center rounded-2xl border border-dashed px-4 py-6"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.trackLight,
      }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: uiColors.surface.accentSoft20 }}>
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={18} color={theme.colors.primary} />
      </View>
      <View className="mt-2 flex-row items-center">
        <Text className="text-base font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
          {isPicking ? pickingTitle : idleTitle}
        </Text>
        {isRequired ? (
          <Text className="ml-1 text-xs font-semibold" style={{ color: theme.colors.negative }}>*</Text>
        ) : null}
      </View>
      <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
        {description}
      </Text>
      <Text className="mt-2 text-[11px]" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
        {helperText}
      </Text>

      {visibleFiles.length > 0 ? (
        <View className="mt-3 w-full gap-2">
          {visibleFiles.map((file, index) => {
            const isPdf = isPdfFile(file);
            const canPreviewImage = isImageFile(file) && !isPdf;
            return (
              <View
                key={`${file.name}-${index}`}
                className="w-full flex-row items-start rounded-xl border px-3 py-2"
                style={{
                  borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                  backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight85,
                }}
              >
                <View
                  className="mr-2 mt-0.5 h-9 w-9 items-center justify-center overflow-hidden rounded-md"
                  style={{ backgroundColor: uiColors.surface.accentSoft20 }}
                >
                  {canPreviewImage ? (
                    <AppImage source={{ uri: file.url }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Ionicons
                      name={isPdf ? 'document-text-outline' : 'image-outline'}
                      size={15}
                      color={theme.colors.primary}
                    />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold" style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                    {file.name}
                  </Text>
                  <Text className="mt-0.5 text-[11px]" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                    {isPdf ? 'PDF file selected' : 'Image file selected'}
                  </Text>
                </View>
              </View>
            );
          })}
          {multiple && extraCount > 0 ? (
            <Text className="text-[11px] font-semibold" style={{ color: theme.colors.primary }}>
              +{extraCount} more file{extraCount > 1 ? 's' : ''}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
