import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { theme, uiColors } from '@/utils/theme';

type SkillCertificateState = 'required' | 'pending' | 'approved' | 'not_required';

type SkillCertificateStatusCardProps = {
  title: string;
  statusLabel: string;
  statusColor: string;
  statusIcon: keyof typeof Ionicons.glyphMap;
  certificateState: SkillCertificateState;
  certificateMessage: string;
  addCertificateLabel: string;
  onAddCertificate?: () => void;
  extraContent?: ReactNode;
};

export function SkillCertificateStatusCard({
  title,
  statusLabel,
  statusColor,
  statusIcon,
  certificateState,
  certificateMessage,
  addCertificateLabel,
  onAddCertificate,
  extraContent,
}: SkillCertificateStatusCardProps) {
  const isDark = useColorScheme() === 'dark';
  const showAddButton = certificateState === 'required' && Boolean(onAddCertificate);

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.overlayLight95,
      }}
    >
      <View className="h-1.5" style={{ backgroundColor: statusColor }} />
      <View className="p-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-base font-bold text-baseDark dark:text-white">{title}</Text>
            <View className="mt-1 flex-row items-center">
              <Ionicons name={statusIcon} size={14} color={statusColor} />
              <Text className="ml-1 text-xs font-semibold" style={{ color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
          {extraContent}
        </View>

        <View
          className="mt-3 flex-row items-start rounded-xl border px-3 py-2"
          style={{
            borderColor:
              certificateState === 'required'
                ? theme.colors.caution
                : certificateState === 'approved'
                  ? theme.colors.positive
                  : theme.colors.accent,
            backgroundColor:
              certificateState === 'required'
                ? uiColors.surface.accentSoft20
                : uiColors.surface.overlayLight85,
          }}
        >
          <Ionicons
            name={
              certificateState === 'required'
                ? 'alert-circle-outline'
                : certificateState === 'approved'
                  ? 'checkmark-circle-outline'
                  : certificateState === 'pending'
                    ? 'time-outline'
                    : 'information-circle-outline'
            }
            size={16}
            color={
              certificateState === 'required'
                ? theme.colors.caution
                : certificateState === 'approved'
                  ? theme.colors.positive
                  : theme.colors.primary
            }
          />
          <Text
            className="ml-2 flex-1 text-xs font-medium"
            style={{
              color:
                certificateState === 'required'
                  ? theme.colors.caution
                  : certificateState === 'approved'
                    ? theme.colors.positive
                    : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight),
            }}
          >
            {certificateMessage}
          </Text>
        </View>

        {showAddButton ? (
          <Pressable
            onPress={onAddCertificate}
            className="mt-3 flex-row items-center justify-center rounded-xl px-3 py-2.5"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Ionicons name="ribbon-outline" size={14} color={theme.colors.onPrimary} />
            <Text className="ml-1.5 text-xs font-semibold" style={{ color: theme.colors.onPrimary }}>
              {addCertificateLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
