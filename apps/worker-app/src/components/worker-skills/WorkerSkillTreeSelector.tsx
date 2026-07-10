import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, Text, UIManager, View } from 'react-native';
import type { WorkerSkillTreeSelectorProps } from '@/types/worker-skills';
import {
  getExistingWorkerSkillForService,
  getUnselectedSelectableServices,
  normalizeServices,
  titleCase,
  toIconBadgeText,
} from '@/utils';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function animateAccordionChange() {
  LayoutAnimation.configureNext({
    duration: 220,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

export function WorkerSkillTreeSelector({
  categories,
  selectedServiceIds,
  existingSkillsByKey,
  disabled = false,
  isDark,
  onToggleService,
}: WorkerSkillTreeSelectorProps) {
  const scrollRefs = useRef<Record<string, ScrollView | null>>({});
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [expandedSubcategoryIds, setExpandedSubcategoryIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedCategoryIds(prev => categories.reduce<Record<string, boolean>>((acc, category) => {
      acc[category.id] = prev[category.id] ?? true;
      return acc;
    }, {}));
  }, [categories]);

  return (
    <View className="gap-3">
      {categories.map(category => {
        const categoryExpanded = expandedCategoryIds[category.id] !== false;
        const subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];

        return (
          <View
            key={category.id}
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke,
              backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
            }}
          >
            <Pressable
              onPress={() => {
                if (disabled) return;
                animateAccordionChange();
                setExpandedCategoryIds(prev => ({ ...prev, [category.id]: !categoryExpanded }));
              }}
              disabled={disabled}
              className="flex-row items-center px-3 py-3"
              style={{ backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.neutralSoftLight }}
            >
              <Ionicons
                name={categoryExpanded ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={isDark ? palette.dark.text : theme.colors.baseDark}
              />
              <View className="ml-2 h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Text className="text-sm font-bold text-primary">
                  {toIconBadgeText(category.name, category.iconText)}
                </Text>
              </View>
              <Text className="ml-3 flex-1 text-sm font-bold text-baseDark dark:text-white">
                {titleCase(category.name)}
              </Text>
            </Pressable>

            {categoryExpanded ? (
              <View>
                {subcategories.map(subcategory => {
                  const subcategoryExpanded = expandedSubcategoryIds[subcategory.id] === true;
                  const services = normalizeServices(subcategory);
                  const unselectedSelectableServices = getUnselectedSelectableServices(
                    services,
                    selectedServiceIds,
                    existingSkillsByKey,
                  );
                  const canSelectAll = !disabled && unselectedSelectableServices.length > 0;

                  return (
                    <View
                      key={subcategory.id}
                      className="border-t"
                      style={{ borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.overlayStrokeLight }}
                    >
                      <View className="flex-row items-center px-4 py-3">
                        <Pressable
                          onPress={() => {
                            if (disabled) return;
                            animateAccordionChange();
                            setExpandedSubcategoryIds(prev => {
                              const nextExpanded = !subcategoryExpanded;
                              if (nextExpanded) {
                                setTimeout(() => {
                                  scrollRefs.current[subcategory.id]?.scrollTo({ x: 28, animated: true });
                                  setTimeout(() => {
                                    scrollRefs.current[subcategory.id]?.scrollTo({ x: 0, animated: true });
                                  }, 360);
                                }, 120);
                              }
                              return { ...prev, [subcategory.id]: nextExpanded };
                            });
                          }}
                          disabled={disabled}
                          className="min-w-0 flex-1 flex-row items-center"
                        >
                          <Ionicons
                            name={subcategoryExpanded ? 'chevron-down' : 'chevron-forward'}
                            size={15}
                            color={isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight}
                          />
                          <Text className="ml-2 flex-1 text-sm font-semibold text-baseDark dark:text-white">
                            {titleCase(subcategory.name)}
                          </Text>
                        </Pressable>
                        <Text className="text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
                          {services.length} {APP_TEXT.profile.skillManager.servicesCountSuffix}
                        </Text>
                        {canSelectAll ? (
                          <Pressable
                            onPress={() => {
                              unselectedSelectableServices.forEach(service => {
                                onToggleService(service);
                              });
                            }}
                            disabled={disabled}
                            className="ml-2 rounded-full px-2 py-1"
                            style={{
                              backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
                            }}
                          >
                            <Text className="text-xs font-semibold text-primary">
                              {APP_TEXT.profile.skillManager.selectAllButton}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>

                      {subcategoryExpanded ? (
                        <View className="pb-3">
                          <View className="relative">
                            <ScrollView
                              ref={node => {
                                scrollRefs.current[subcategory.id] = node;
                              }}
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={{ paddingLeft: 16, paddingRight: 48 }}
                            >
                              <View className="flex-row gap-2">
                                {services.map(service => {
                                  const selected = Boolean(selectedServiceIds[service.id]);
                                  const existingSkill = getExistingWorkerSkillForService(service, existingSkillsByKey);
                                  const alreadyAdded = Boolean(existingSkill);
                                  const serviceDisabled = disabled || alreadyAdded;

                                  return (
                                    <Pressable
                                      key={`${subcategory.id}-${service.id}`}
                                      onPress={() => {
                                        if (serviceDisabled) return;
                                        onToggleService(service);
                                      }}
                                      disabled={serviceDisabled}
                                      className={`${serviceDisabled && !selected ? 'opacity-75' : ''} min-h-[138px] w-48 rounded-2xl border p-3`}
                                      style={{
                                        borderColor: selected
                                          ? theme.colors.primary
                                          : alreadyAdded
                                            ? theme.colors.stroke
                                            : (isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke),
                                        backgroundColor: selected
                                          ? (isDark ? uiColors.surface.cardMutedDark : palette.light.card)
                                          : alreadyAdded
                                            ? (isDark ? uiColors.surface.overlayDark08 : uiColors.surface.warmSubtleLight)
                                            : (isDark ? uiColors.surface.cardMutedDark : palette.light.card),
                                      }}
                                    >
                                      <View className="min-h-10 flex-row items-center">
                                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                          <Text className="text-sm font-bold text-primary">
                                            {toIconBadgeText(service.name, service.iconText)}
                                          </Text>
                                        </View>
                                        <Text
                                          className="ml-3 flex-1 text-sm font-bold leading-5 text-baseDark dark:text-white"
                                          numberOfLines={2}
                                        >
                                          {titleCase(service.description || service.name)}
                                        </Text>
                                      </View>

                                      <View className="mt-3 flex-1 justify-between">
                                        <View
                                          className="self-start rounded-full px-2.5 py-1"
                                          style={{
                                            backgroundColor: service.isCertificateRequired
                                              ? uiColors.surface.accentSoft20
                                              : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.neutralSoftLight),
                                          }}
                                        >
                                          <View className="flex-row items-center">
                                            <Ionicons
                                              name={service.isCertificateRequired ? 'document-text-outline' : 'checkmark-circle-outline'}
                                              size={12}
                                              color={service.isCertificateRequired ? theme.colors.primary : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight)}
                                            />
                                            <Text
                                              className="ml-1 text-[11px] font-semibold"
                                              numberOfLines={1}
                                              style={{ color: service.isCertificateRequired ? theme.colors.primary : (isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight) }}
                                            >
                                              {service.isCertificateRequired
                                                ? APP_TEXT.profile.skillManager.certificateRequiredLabel
                                                : APP_TEXT.profile.skillManager.autoApprovalLabel}
                                            </Text>
                                          </View>
                                        </View>

                                        <View
                                          className="mt-4 min-h-[32px] flex-row items-center justify-center rounded-xl border px-3 py-2"
                                          style={{
                                            borderColor: selected
                                              ? theme.colors.primary
                                              : alreadyAdded
                                                ? theme.colors.stroke
                                                : uiColors.surface.overlayStrokeLight,
                                            backgroundColor: selected
                                              ? theme.colors.primary
                                              : alreadyAdded
                                                ? uiColors.surface.accentSoft20
                                                : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.noticeWarmLight),
                                          }}
                                        >
                                          {selected ? (
                                            <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />
                                          ) : alreadyAdded ? (
                                            <Ionicons name="lock-closed" size={13} color={theme.colors.primary} />
                                          ) : (
                                            <Ionicons name="add" size={14} color={theme.colors.primary} />
                                          )}
                                          <Text
                                            className="ml-1.5 text-xs font-bold"
                                            style={{
                                              color: selected
                                                ? theme.colors.onPrimary
                                                : theme.colors.primary,
                                            }}
                                          >
                                            {selected
                                              ? APP_TEXT.profile.skillManager.selectedLabel
                                              : alreadyAdded
                                                ? APP_TEXT.profile.skillManager.addedLabel
                                                : APP_TEXT.profile.skillManager.addSkillLabel}
                                          </Text>
                                        </View>
                                      </View>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </ScrollView>
                            <LinearGradient
                              pointerEvents="none"
                              colors={isDark
                                ? [uiColors.surface.overlayDark10, uiColors.surface.cardDefaultDark]
                                : [uiColors.surface.overlayLight85, palette.light.card]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              className="absolute bottom-0 right-0 top-0 w-10"
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
