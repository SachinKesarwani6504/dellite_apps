import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { CategoryService } from '@/types/auth';
import { titleCase, toIconBadgeText } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type WorkerSkillReviewListProps = {
  selectedServices: CategoryService[];
  disabled?: boolean;
  isDark: boolean;
  onRemoveService: (serviceId: string) => void;
};

export function WorkerSkillReviewList({
  selectedServices,
  disabled = false,
  isDark,
  onRemoveService,
}: WorkerSkillReviewListProps) {
  if (selectedServices.length === 0) {
    return (
      <ListEmptyState
        icon="checkmark-done-outline"
        title="No skills selected yet."
        description="Select skills from above and preview them here."
      />
    );
  }

  return (
    <View className="gap-2">
      {selectedServices.map((service, index) => (
        <View
          key={`${service.id}-${service.name}-${index}`}
          className="rounded-2xl border border-accent/40 bg-white p-3 dark:border-white/10"
          style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }}
        >
          <View className="flex-row items-center justify-between">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Text className="font-bold text-primary">
                {toIconBadgeText(service.name, service.iconText)}
              </Text>
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-sm font-bold text-baseDark dark:text-white">
                {titleCase(service.description || service.name)}
              </Text>
              {service.isCertificateRequired ? (
                <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                  Certificate Required
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                if (disabled) return;
                onRemoveService(service.id);
              }}
              disabled={disabled}
              className={`flex-row items-center rounded-full px-3 py-1.5 ${disabled ? 'opacity-60' : ''}`}
              style={{ backgroundColor: uiColors.surface.accentSoft20 }}
            >
              <Ionicons name="close" size={12} color={theme.colors.primary} />
              <Text className="ml-1 text-xs font-semibold text-primary">Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
