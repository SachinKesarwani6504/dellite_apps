import { Pressable, ScrollView, Text, View } from 'react-native';
import { ServiceSubcategory } from '@/types/auth';
import { titleCase, toIconBadgeText } from '@/utils';
import { palette, theme, uiColors } from '@/utils/theme';

type WorkerSkillSubcategoryTabsProps = {
  subcategories: ServiceSubcategory[];
  selectedSubcategoryId?: string | null;
  disabled?: boolean;
  isDark: boolean;
  onSelectSubcategory: (subcategory: ServiceSubcategory) => void;
};

export function WorkerSkillSubcategoryTabs({
  subcategories,
  selectedSubcategoryId,
  disabled = false,
  isDark,
  onSelectSubcategory,
}: WorkerSkillSubcategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 4, paddingRight: 8 }}
      className="mb-3"
    >
      <View className="flex-row gap-2">
        {subcategories.map(subcategory => {
          const isSelectedSubcategory = selectedSubcategoryId === subcategory.id;
          return (
            <Pressable
              key={subcategory.id}
              onPress={() => {
                if (disabled) return;
                onSelectSubcategory(subcategory);
              }}
              disabled={disabled}
              className="rounded-full border px-3 py-2"
              style={{
                borderColor: isSelectedSubcategory ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight),
                backgroundColor: isSelectedSubcategory ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
              }}
            >
              <View className="flex-row items-center">
                <View className="mr-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                  <Text className="text-[10px] font-bold text-primary">
                    {toIconBadgeText(subcategory.name, subcategory.iconText)}
                  </Text>
                </View>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isSelectedSubcategory ? theme.colors.primary : (isDark ? palette.dark.text : palette.light.text) }}
                >
                  {titleCase(subcategory.name)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
