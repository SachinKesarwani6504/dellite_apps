import { Pressable, Text, View } from 'react-native';
import { AppImage } from '@/components/common/AppImage';
import type { CustomerHomeCategory } from '@/types/customer';
import { palette, safeImageUrl, titleCase, toIconBadgeText, uiColors } from '@/utils';

type WorkerSkillCategoryGridProps = {
  categories: CustomerHomeCategory[];
  selectedCategoryId?: string | null;
  disabled?: boolean;
  isDark: boolean;
  onSelectCategory: (category: CustomerHomeCategory) => void;
};

export function WorkerSkillCategoryGrid({
  categories,
  selectedCategoryId,
  disabled = false,
  isDark,
  onSelectCategory,
}: WorkerSkillCategoryGridProps) {
  const getServiceCountLabel = (category: CustomerHomeCategory) => {
    const rawCount = category.serviceCount;
    const parsedCount = typeof rawCount === 'string' ? Number(rawCount) : rawCount;
    const serviceCount = typeof parsedCount === 'number' && Number.isFinite(parsedCount) ? parsedCount : 0;
    const label = serviceCount === 1 ? 'service' : 'services';

    return `${serviceCount.toString()} ${label}`;
  };

  return (
    <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
      {categories.map(category => {
        const isSelected = selectedCategoryId === category.id;
        const iconImageUrl = safeImageUrl(category.iconImage?.url) ?? safeImageUrl(category.mainImage?.url);
        const cardBackground = !isSelected
          ? { backgroundColor: isDark ? uiColors.surface.cardMutedDark : palette.light.card }
          : undefined;

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
            style={cardBackground}
          >
            <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
              {iconImageUrl ? (
                <AppImage source={{ uri: iconImageUrl }} resizeMode="cover" className="h-full w-full" />
              ) : (
                <Text className="text-sm font-bold text-primary">
                  {toIconBadgeText(category.name, category.iconText)}
                </Text>
              )}
            </View>
            <Text className="mt-2 text-sm font-bold text-baseDark dark:text-white">{titleCase(category.name)}</Text>
            <Text className="mt-1 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
              {getServiceCountLabel(category)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
