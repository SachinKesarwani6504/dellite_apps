import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { CertificateUploadCardProps } from '@/types/certificate-upload-card';
import { isImageFile, isPdfFile, titleCase } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

const text = APP_TEXT.profile.certificates.card;

export function CertificateUploadCard({
  card,
  selectedType,
  selectedFile,
  isViewOnly,
  isPicking,
  disabled = false,
  isDark,
  showTypeError = false,
  onSelectType,
  onPickFile,
}: CertificateUploadCardProps) {
  const title = card.title?.trim() || text.fallbackTitle;
  const serviceNames = (
    Array.isArray(card.serviceNames) && card.serviceNames.length > 0
      ? card.serviceNames
      : (card.serviceName?.trim() ? [card.serviceName.trim()] : [])
  ).filter(name => name.trim().length > 0);
  const allowedTypes = Array.isArray(card.allowedCertificateTypes) ? card.allowedCertificateTypes : [];
  const hasFile = Boolean(selectedFile);
  const hasType = Boolean(selectedType);
  const isApproved = card.certificateStatus === 'APPROVED';
  const statusBadge = isViewOnly
    ? (isApproved
      ? {
        status: 'COMPLETED',
        label: text.approvedBadge,
        iconName: 'checkmark-circle',
      }
      : {
        status: 'PENDING',
        type: 'payment' as const,
        label: text.pendingBadge,
        iconName: 'time',
      })
    : {
      status: 'SEARCHING',
      label: text.actionNeededBadge,
      iconName: 'alert-circle',
    };
  const headerGradient: readonly [string, string] = isDark
    ? [uiColors.surface.cardElevatedDark, uiColors.surface.cardMutedDark]
    : [theme.colors.surfaceSoft, uiColors.surface.warmSubtleLight];
  const headerTitleColor = isDark ? palette.dark.text : theme.colors.textPrimary;
  const headerSubtitleColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const selectedFileIsPdf = selectedFile ? isPdfFile(selectedFile) : false;
  const selectedFileCanPreview = selectedFile
    ? isImageFile(selectedFile) && !selectedFileIsPdf
    : false;

  return (
    <View
      className="overflow-hidden rounded-3xl border"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card,
        shadowColor: uiColors.shadow.base,
        shadowOpacity: isDark ? 0 : 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="border-b px-4 pb-5 pt-4"
        style={{ borderBottomColor: isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke }}
      >
        <View className="flex-row items-start">
          <View
            className="mr-3 h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20 }}
          >
            <Ionicons
              name={isViewOnly ? (isApproved ? 'shield-checkmark' : 'hourglass') : 'ribbon'}
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start">
              <Text className="mr-2 flex-1 text-lg font-bold" style={{ color: headerTitleColor }} numberOfLines={2}>
                {title}
              </Text>
              <StatusBadge
                status={statusBadge.status}
                type={'type' in statusBadge ? statusBadge.type : undefined}
                label={statusBadge.label}
                iconName={statusBadge.iconName}
                showDot={false}
              />
            </View>
            {!!card.description ? (
              <Text className="mt-1 text-xs leading-4" style={{ color: headerSubtitleColor }}>
                {card.description}
              </Text>
            ) : null}
          </View>
        </View>

        {!isViewOnly ? (
          <View className="mt-4 flex-row items-center">
            <View className="flex-row items-center">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: hasType
                    ? theme.colors.primary
                    : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20),
                }}
              >
                <Ionicons
                  name={hasType ? 'checkmark' : 'document-text-outline'}
                  size={15}
                  color={hasType ? theme.colors.onPrimary : theme.colors.primary}
                />
              </View>
              <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: headerSubtitleColor }}>
                {text.progressTypeLabel}
              </Text>
            </View>
            <View
              className="mx-2 h-0.5 flex-1 rounded-full"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark14 : theme.colors.stroke }}
            />
            <View className="flex-row items-center">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: hasFile
                    ? theme.colors.primary
                    : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20),
                }}
              >
                <Ionicons
                  name={hasFile ? 'checkmark' : 'cloud-upload-outline'}
                  size={15}
                  color={hasFile ? theme.colors.onPrimary : theme.colors.primary}
                />
              </View>
              <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: headerSubtitleColor }}>
                {text.progressFileLabel}
              </Text>
            </View>
          </View>
        ) : null}
      </LinearGradient>

      <View className="px-4 pb-4 pt-3">
        {serviceNames.length > 0 ? (
          <View className="mb-3">
            <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
              {text.neededForLabel}
            </Text>
            <View className="mt-2 flex-row flex-wrap">
              {serviceNames.map((serviceName, chipIndex) => (
                <View
                  key={`${title}-service-${chipIndex}`}
                  className="mb-2 mr-2 max-w-full flex-row items-center rounded-full border px-2.5 py-1.5"
                  style={{
                    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
                    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmSoftLight,
                  }}
                >
                  <Ionicons name="briefcase-outline" size={11} color={theme.colors.primary} />
                  <Text
                    className="ml-1 shrink text-[11px] font-semibold"
                    style={{ color: isDark ? palette.dark.text : theme.colors.textPrimary }}
                    numberOfLines={2}
                  >
                    {titleCase(serviceName)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!isViewOnly ? (
          <>
            <View className="mb-1 flex-row items-center">
              <Text className="text-sm font-bold" style={{ color: isDark ? palette.dark.text : theme.colors.textPrimary }}>{text.stepTypeTitle}</Text>
              <Text className="ml-1 text-sm font-bold" style={{ color: theme.colors.negative }}>*</Text>
            </View>
            <Text className="mb-2.5 text-[11px] leading-4" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {text.stepTypeHint}
            </Text>

            <View className="gap-2">
              {allowedTypes.map((type, typeIndex) => {
                const isSelected = selectedType === type;
                return (
                  <Pressable
                    key={`${title}-type-${typeIndex}`}
                    onPress={() => {
                      if (disabled || isPicking) return;
                      onSelectType(type);
                    }}
                    disabled={disabled || isPicking}
                    className="flex-row items-center rounded-2xl border px-3 py-3.5"
                    style={{
                      borderColor: isSelected
                        ? theme.colors.primary
                        : (showTypeError && !selectedType
                          ? theme.colors.negative
                          : (isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke)),
                      backgroundColor: isSelected
                        ? (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmSoftLight)
                        : (isDark ? uiColors.surface.overlayDark08 : uiColors.surface.cardNeutralLight),
                      borderWidth: isSelected ? 1.5 : 1,
                    }}
                  >
                    <View
                      className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: isSelected ? theme.colors.primary : uiColors.surface.accentSoft20 }}
                    >
                      <Ionicons
                        name={isSelected ? 'document-text' : 'document-text-outline'}
                        size={18}
                        color={isSelected ? theme.colors.onPrimary : theme.colors.primary}
                      />
                    </View>
                    <Text
                      className="flex-1 text-sm font-bold"
                      style={{
                        color: isSelected
                          ? theme.colors.primary
                          : (isDark ? palette.dark.text : palette.light.text),
                      }}
                    >
                      {titleCase(type)}
                    </Text>
                    <View
                      className="h-6 w-6 items-center justify-center rounded-full border"
                      style={{
                        borderColor: isSelected ? theme.colors.primary : (isDark ? uiColors.text.captionDark : uiColors.text.captionLight),
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                      }}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={13} color={theme.colors.onPrimary} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {showTypeError && !selectedType ? (
              <Text className="mt-2 text-[11px] font-semibold" style={{ color: theme.colors.negative }}>
                {text.typeRequiredHint}
              </Text>
            ) : null}

            <View className="mb-1 mt-4 flex-row items-center">
              <Text className="text-sm font-bold" style={{ color: isDark ? palette.dark.text : theme.colors.textPrimary }}>{text.stepUploadTitle}</Text>
              <Text className="ml-1 text-sm font-bold" style={{ color: theme.colors.negative }}>*</Text>
            </View>
            <Text className="mb-2.5 text-[11px] leading-4" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {text.stepUploadHint}
            </Text>

            <Pressable
              onPress={onPickFile}
              disabled={disabled || isPicking}
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: hasFile
                  ? theme.colors.primary
                  : (isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke),
                borderStyle: hasFile ? 'solid' : 'dashed',
                borderWidth: hasFile ? 1.5 : 1.5,
                backgroundColor: hasFile
                  ? (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.warmSoftLight)
                  : (isDark ? uiColors.surface.overlayDark08 : uiColors.surface.warmSubtleLight),
              }}
            >
              {hasFile && selectedFile ? (
                <View className="p-3">
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 h-16 w-16 items-center justify-center overflow-hidden rounded-xl"
                      style={{ backgroundColor: uiColors.surface.accentSoft20 }}
                    >
                      {selectedFileCanPreview ? (
                        <AppImage
                          source={{ uri: selectedFile.url }}
                          resizeMode="cover"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Ionicons
                          name={selectedFileIsPdf ? 'document-text' : 'image'}
                          size={26}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-bold" style={{ color: theme.colors.primary }}>
                        {text.uploadReadyTitle}
                      </Text>
                      <Text className="mt-0.5 text-xs font-semibold" numberOfLines={1} style={{ color: isDark ? palette.dark.text : palette.light.text }}>
                        {selectedFile.name}
                      </Text>
                      <Text className="mt-1 text-[11px]" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                        {text.uploadReadySubtitle}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="mt-3 flex-row items-center justify-center rounded-xl py-2.5"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Ionicons name="swap-horizontal" size={15} color={theme.colors.onPrimary} />
                    <Text className="ml-1.5 text-xs font-bold" style={{ color: theme.colors.onPrimary }}>
                      {isPicking ? text.uploadPickingTitle : text.uploadChangeTitle}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="items-center px-4 py-6">
                  <View
                    className="h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: uiColors.surface.accentSoft20 }}
                  >
                    <Ionicons name="cloud-upload" size={26} color={theme.colors.primary} />
                  </View>
                  <Text className="mt-3 text-base font-bold" style={{ color: isDark ? palette.dark.text : theme.colors.textPrimary }}>
                    {isPicking ? text.uploadPickingTitle : text.uploadIdleTitle}
                  </Text>
                  <Text className="mt-1 text-center text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    {text.uploadDescription}
                  </Text>
                  <View
                    className="mt-3 flex-row items-center rounded-full px-3 py-1.5"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Ionicons name="folder-open-outline" size={13} color={theme.colors.onPrimary} />
                    <Text className="ml-1.5 text-xs font-bold" style={{ color: theme.colors.onPrimary }}>
                      {text.uploadCtaLabel}
                    </Text>
                  </View>
                  <Text className="mt-2.5 text-[11px]" style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}>
                    {text.uploadHelper}
                  </Text>
                </View>
              )}
            </Pressable>
          </>
        ) : (
          <View
            className="rounded-2xl border px-3 py-4"
            style={{
              borderColor: isApproved ? theme.colors.positive : theme.colors.caution,
              backgroundColor: isApproved
                ? (isDark ? uiColors.status.successDark : uiColors.status.successLight)
                : (isDark ? uiColors.status.warningDark : uiColors.status.warningLight),
            }}
          >
            <View className="flex-row items-start">
              <View
                className="mr-3 h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: theme.colors.onPrimary }}
              >
                <Ionicons
                  name={isApproved ? 'checkmark-circle' : 'time'}
                  size={22}
                  color={isApproved ? theme.colors.positive : theme.colors.caution}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold" style={{ color: isApproved ? uiColors.status.successText : uiColors.status.warningText }}>
                  {isApproved ? text.verifiedTitle : text.pendingTitle}
                </Text>
                <Text className="mt-1 text-xs leading-4" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  {isApproved ? text.verifiedSubtitle : text.pendingSubtitle}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
