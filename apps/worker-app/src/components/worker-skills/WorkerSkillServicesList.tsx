import { Pressable, Text, View } from 'react-native';
import { CategoryService } from '@/types/auth';
import { titleCase, toIconBadgeText } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type WorkerSkillServicesListProps = {
  services: CategoryService[];
  selectedServiceIds: Record<string, CategoryService>;
  disabled?: boolean;
  isDark: boolean;
  onToggleService: (service: CategoryService) => void;
};

export function WorkerSkillServicesList({
  services,
  selectedServiceIds,
  disabled = false,
  isDark,
  onToggleService,
}: WorkerSkillServicesListProps) {
  return (
    <View className="gap-2">
      {services.map((service, index) => {
        const selected = Boolean(selectedServiceIds[service.id]);
        const itemKey = `${service.id}-${service.name}-${index}`;
        return (
          <Pressable
            key={itemKey}
            onPress={() => {
              if (disabled) return;
              onToggleService(service);
            }}
            disabled={disabled}
            className={`rounded-2xl border p-3 ${
              selected
                ? 'border-primary bg-primary/10'
                : 'border-accent/40 bg-white dark:border-white/10'
            }`}
            style={!selected ? { backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card } : undefined}
          >
            <View className="flex-row items-center justify-between">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Text className="font-bold text-primary">
                  {toIconBadgeText(service.name, service.iconText)}
                </Text>
              </View>
              <View className="flex-1 pr-2">
                <Text className={`text-sm font-bold ${selected ? 'text-primary' : 'text-baseDark dark:text-white'}`}>
                  {titleCase(service.description || service.name)}
                </Text>
                {service.isCertificateRequired ? (
                  <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                    Certificate Required
                  </Text>
                ) : null}
              </View>
              <View
                className={`h-6 w-6 items-center justify-center rounded-full border ${
                  selected ? 'border-primary bg-primary' : 'bg-white dark:bg-transparent'
                }`}
                style={!selected ? { borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight } : undefined}
              >
                {selected ? <Text className="text-[10px] font-bold text-white">OK</Text> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
