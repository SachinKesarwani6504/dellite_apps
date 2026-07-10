import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { WorkerSelectedSkillStripProps } from '@/types/worker-skills';
import { titleCase, toIconBadgeText } from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';

export function WorkerSelectedSkillStrip({
  selectedServices,
  disabled = false,
  isDark,
  onRemoveService,
}: WorkerSelectedSkillStripProps) {
  if (selectedServices.length === 0) return null;

  return (
    <View
      className="mb-3 rounded-2xl border px-3 py-3"
      style={{
        borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
        backgroundColor: isDark ? uiColors.surface.cardDefaultDark : theme.colors.onPrimary,
      }}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: uiColors.surface.accentSoft20 }}
          >
            <Ionicons name="checkmark-done" size={14} color={theme.colors.primary} />
          </View>
          <Text className="ml-2 text-xs font-bold uppercase tracking-wide text-baseDark dark:text-white">
            {selectedServices.length} {APP_TEXT.profile.skillManager.selectedCountLabel}
          </Text>
        </View>
        <Text className="text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.profile.skillManager.removeSelectedHint}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        <View className="flex-row gap-2">
          {selectedServices.map(service => (
            <Pressable
              key={`selected-${service.id}`}
              onPress={() => {
                if (disabled) return;
                onRemoveService(service);
              }}
              disabled={disabled}
              className="flex-row items-center rounded-full border px-3 py-2"
              style={{
                borderColor: isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke,
                backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.warmSubtleLight,
              }}
            >
              <View
                className="h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: uiColors.surface.accentSoft20 }}
              >
                <Text className="text-[9px] font-bold text-primary">
                  {toIconBadgeText(service.name, service.iconText)}
                </Text>
              </View>
              <Text className="mx-2 text-xs font-semibold text-baseDark dark:text-white">
                {titleCase(service.description || service.name)}
              </Text>
              <Ionicons name="close-circle" size={14} color={theme.colors.primary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
