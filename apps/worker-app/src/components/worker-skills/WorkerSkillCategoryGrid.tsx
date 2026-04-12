import { Pressable, Text, View } from 'react-native';
import { ServiceCategory } from '@/types/auth';
import { titleCase, toIconBadgeText } from '@/utils';
import { palette, uiColors } from '@/utils/theme';

type WorkerSkillCategoryGridProps = {
  categories: ServiceCategory[];
  selectedCategoryId?: string | null;
  disabled?: boolean;
  isDark: boolean;
  onSelectCategory: (category: ServiceCategory) => void;
};

export function WorkerSkillCategoryGrid({
  categories,
  selectedCategoryId,
  disabled = false,
  isDark,
  onSelectCategory,
}: WorkerSkillCategoryGridProps) {
  return (
    <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
      {categories.map(category => {
        const isSelected = selectedCategoryId === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => {
              if (disabled) return;
              onSelectCategory(category);
            }}
            disabled={disabled}
            className={`w-[48%] rounded-2xl border p-3 ${
              isSelected ? 'border-primary bg-primary/10' : 'border-accent/40 bg-white dark:border-white/10'
            }`}
            style={!isSelected ? { backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card } : undefined}
          >
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Text className="text-sm font-bold text-primary">
                {toIconBadgeText(category.name, category.iconText)}
              </Text>
            </View>
            <Text className="mt-2 text-sm font-bold text-baseDark dark:text-white">{titleCase(category.name)}</Text>
            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {(category.subcategories?.length ?? 0).toString()} subcategories
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
